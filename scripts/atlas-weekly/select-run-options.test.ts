import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test, { type TestContext } from "node:test";

const windows = { skip: process.platform !== "win32" };
const menuFile = path.resolve("scripts/atlas-weekly/select-run-options.bat");

function select(t: TestContext, keys: string, cliFiles: readonly string[] = []) {
  const parent = path.resolve("test-results");
  mkdirSync(parent, { recursive: true });
  const cwd = mkdtempSync(path.join(parent, "weekly-launcher-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const bin = path.join(cwd, "fake-path");
  mkdirSync(bin);
  for (const file of cliFiles) writeFileSync(path.join(bin, file), "");

  // This harness only prints the exported settings. It never runs npm or opens a browser.
  writeFileSync(path.join(cwd, "menu-test.bat"), [
    "@echo off",
    'set "ATLAS_WRITER=parent"',
    'set "ATLAS_WEEKLY_ARGS=stale"',
    "setlocal",
    `call "${menuFile}"`,
    "if errorlevel 1 exit /b 1",
    "echo WRITER=[%ATLAS_WRITER%]",
    "echo ARGS=[%ATLAS_WEEKLY_ARGS%]",
    "endlocal",
    "echo PARENT=[%ATLAS_WRITER%]",
  ].join("\r\n") + "\r\n");
  const result = spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/c", "menu-test.bat"], {
    cwd,
    env: { ...process.env, PATH: bin, PATHEXT: ".COM;.EXE;.BAT;.CMD" },
    input: keys + "\r\n",
    encoding: "utf8",
    windowsHide: true,
    timeout: 5_000,
  });
  assert.ifError(result.error);
  return result;
}

test("normal mode ignores invalid keys and leaves the parent environment unchanged", windows, (t) => {
  const { status, stdout } = select(t, "x3z1");
  assert.equal(status, 0, stdout);
  assert.match(stdout, /WRITER=\[none\]/);
  assert.match(stdout, /ARGS=\[\]/);
  assert.match(stdout, /PARENT=\[parent\]/);
});

test("Codex accepts a native executable or PowerShell shim and passes explicit rerun arguments", windows, (t) => {
  for (const executable of ["codex.exe", "codex.ps1"]) {
    const { status, stdout } = select(t, "12", [executable]);
    assert.equal(status, 0, stdout);
    assert.match(stdout, /WRITER=\[codex\]/);
    assert.match(stdout, /ARGS=\[-- --rerun\]/);
  }
});

test("Cursor checks for agent and normal mode clears stale arguments", windows, (t) => {
  const { status, stdout } = select(t, "21", ["agent.exe"]);
  assert.equal(status, 0, stdout);
  assert.match(stdout, /WRITER=\[cursor\]/);
  assert.match(stdout, /ARGS=\[\]/);
});

test("Back returns to writer selection before preflight", windows, (t) => {
  const { status, stdout } = select(t, "1331");
  assert.equal(status, 0, stdout);
  assert.equal(stdout.match(/Select a writer/g)?.length, 2);
  assert.match(stdout, /WRITER=\[none\]/);
});

test("missing writer executables fail before a run is selected", windows, (t) => {
  for (const [keys, message] of [["11", /Codex CLI was not found/], ["21", /Cursor Agent CLI .* was not found/]] as const) {
    const { status, stdout } = select(t, keys);
    assert.equal(status, 1, stdout);
    assert.match(stdout, message);
    assert.doesNotMatch(stdout, /WRITER=\[/);
  }
});
