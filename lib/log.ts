// Structured JSON logs for querying in CloudWatch Logs Insights
type Level = "info" | "warn" | "error";

export function log(level: Level, message: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    version: process.env.APP_VERSION ?? "dev",
    ...fields,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}
