/** Convert snake_case API keys to camelCase (shallow + one-level nested objects). */
export function toCamelCase<T>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item)) as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      out[camel] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? toCamelCase(value)
          : value;
    }
    return out as T;
  }
  return input as T;
}