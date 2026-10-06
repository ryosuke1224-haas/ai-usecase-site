import fs from "node:fs";

export default function globalSetup() {
  fs.mkdirSync("agent-reports", { recursive: true });
  fs.mkdirSync("test-results", { recursive: true });
}
