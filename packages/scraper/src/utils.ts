/**
 * Splits an address like "1304/421 King William Street" into:
 *  - unit: "1304/421"
 *  - street: "king william street"
 */
export function separateUnitAndStreet(fullAddress: string): {
  unit: string;
  street: string;
} {
  // Trim and split by one or more spaces
  const parts = fullAddress.trim().split(/\s+/);

  if (parts.length === 1) {
    // Edge case: only one token, e.g. "1304/421"
    return {
      unit: parts[0],
      street: "",
    };
  }

  // The first token is considered the 'unit'
  const [unit, ...streetParts] = parts;

  // Join the remaining tokens for the street
  // Convert to lowercase if you want "king william street"
  // instead of "King William Street"
  const street = streetParts.join(" ").toLowerCase();

  return { unit, street };
}

export function cleanInnerHtml(data: string): string {
  return data.replace(/<!--[\s\S]*?-->/g, "");
}
