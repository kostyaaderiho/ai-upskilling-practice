type Level = "info" | "warn" | "error";

export type Logger = Record<Level, (msg: string, extra?: Record<string, unknown>) => void>;

export function getLogger(name: string): Logger {
  const write = (level: Level) => (msg: string, extra: Record<string, unknown> = {}) => {
    process.stdout.write(JSON.stringify({ level, logger: name, msg, ...extra }) + "\n");
  };
  return { info: write("info"), warn: write("warn"), error: write("error") };
}
