export function requireArgument(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export function requireNumericString(value, label) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a number.`);
  }

  return value;
}
