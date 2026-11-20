// .claude/hooks/block-env.mjs
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8")).tool_input ?? {};
const target = ["file_path", "path", "command", "pattern"]
  .map((k) => String(input[k] ?? ""))
  .join(" ");
if (/(^|[\s/'"])\.env(?![\w.])/.test(target)) {
  console.error("Reading .env is forbidden by the project rules.");
  process.exit(2); // exit code 2 blocks the tool call
}
