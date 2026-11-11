/** Number boxes of the filters (v1 `InputSetting` with `applyFormatNumber`): thousands grouped as the viewer types. */

const NUMBER = /^(-?)(\d*)(\.\d*)?$/;

/** The text without its thousands separators. */
export function ungroupThousands(text: string | undefined): string {
  return (text ?? '').replaceAll(',', '');
}

/**
 * A number's text with its thousands grouped by commas (`9958` → `9,958`). Whatever follows the decimal point is kept
 * as typed, so a number being typed (`1234.`, `-`) stays editable; text that is no number is returned as is.
 */
export function groupThousands(text: string): string {
  const match = NUMBER.exec(ungroupThousands(text));
  if (!match) return text;
  const [, sign = '', integer = '', fraction = ''] = match;
  return `${sign}${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction}`;
}
