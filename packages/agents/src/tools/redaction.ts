const SENSITIVE_KEY = /(api[-_]?key|authorization|cookie|password|secret|token)/i;

export function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveValues);
  if (!isRecord(value)) return value;

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactSensitiveValues(nested),
  ]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
