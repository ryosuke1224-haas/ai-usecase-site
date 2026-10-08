import { spawn } from "node:child_process";
import { tail } from "./redact";

export type CommandResult = {
  status: "pass" | "fail";
  duration_ms: number;
  detail: string;
};

export function runCommand(command: string, env: NodeJS.ProcessEnv = process.env): Promise<CommandResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: process.cwd(),
      shell: true,
      env,
      windowsHide: true,
    });
    let output = "";
    const push = (chunk: Buffer) => {
      const text = chunk.toString();
      output = (output + text).slice(-100_000);
      process.stdout.write(text);
    };
    child.stdout?.on("data", push);
    child.stderr?.on("data", push);
    child.on("error", (error) => {
      resolve({
        status: "fail",
        duration_ms: Date.now() - started,
        detail: tail(`${output}\n${error.message}`),
      });
    });
    child.on("close", (code) => {
      resolve({
        status: code === 0 ? "pass" : "fail",
        duration_ms: Date.now() - started,
        detail: tail(output),
      });
    });
  });
}
