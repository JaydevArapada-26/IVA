export function assertDefined<TValue>(
  value: TValue | null | undefined,
  message = 'Expected value to be defined',
): asserts value is TValue {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

export function assertNever(value: never, message = 'Unexpected exhaustive branch'): never {
  throw new Error(`${message}: ${String(value)}`);
}
