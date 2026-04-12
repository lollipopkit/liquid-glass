let filterCounter = 0;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createFilterId(prefix: string) {
  filterCounter += 1;
  return `${prefix}-${filterCounter}`;
}

export function toCssSize(
  value: number | string | undefined,
  fallback: string
) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value ?? fallback;
}
