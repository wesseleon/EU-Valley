/**
 * Converts a 2-letter country code (ISO 3166-1 alpha-2) to a flag emoji.
 * Works by converting each letter to its regional indicator symbol equivalent.
 */
export const countryCodeToFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  
  const code = countryCode.toUpperCase();
  const offset = 127397; // Regional indicator symbol offset
  
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
};
