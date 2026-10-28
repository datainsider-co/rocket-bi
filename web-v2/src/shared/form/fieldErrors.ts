const MAX_PORT = 65_535;

/** `undefined` when `value` has something besides spaces. */
export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required!`;
}

/** `undefined` for a whole number from 1 to 65535. */
export function portError(value: string, label: string): string | undefined {
  const text = value.trim();
  if (!text) return `${label} is required!`;
  const port = Number(text);
  return /^\d+$/.test(text) && port >= 1 && port <= MAX_PORT ? undefined : `${label} must be from 1 to ${MAX_PORT}`;
}
