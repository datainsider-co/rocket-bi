const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Whether the text is a hex color: `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. */
export function isHexColor(text: string): boolean {
  return HEX.test(text.trim());
}

/** What the color box shows: the hex, or "Theme" for a variable that follows the dashboard's theme. */
export function colorText(value: string): string {
  return value.startsWith('var(') ? 'Theme' : value;
}
