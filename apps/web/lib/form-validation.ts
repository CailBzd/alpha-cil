export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// A handful of newer routes trim before checking (rejects "   " as empty);
// kept distinct from isNonEmptyString rather than silently changing the
// behavior of the routes that don't.
export function isNonEmptyStringTrimmed(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}
