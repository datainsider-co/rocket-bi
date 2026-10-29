/**
 * Row boundaries of CSV text. A row ends at a line feed outside double quotes, so a quoted cell can hold line breaks
 * (`""` inside quotes toggles twice and changes nothing). `\r\n` ends a row too: the `\r` stays with the row, and the
 * server's parser drops it. The text is never split into cells: the server parses it.
 */

/** Index just past the end of row `count` (1-based), or -1 when `text` holds fewer complete rows. */
function rowEndIndex(text: string, count: number): number {
  let inQuotes = false;
  let rows = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === '\n' && !inQuotes && ++rows === count) return index + 1;
  }
  return -1;
}

/** The complete rows of `text` (each with its line feed) and the unfinished rest, which the next read continues. */
export function splitCompleteRows(text: string): { complete: string; rest: string } {
  let inQuotes = false;
  let end = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === '\n' && !inQuotes) end = index + 1;
  }
  return { complete: text.slice(0, end), rest: text.slice(end) };
}

/** `text` without its first row: the header, which `ingestion/csv` would insert as data. */
export function dropFirstRow(text: string): string {
  const end = rowEndIndex(text, 1);
  return end === -1 ? '' : text.slice(end);
}

/** The first `count` rows of `text`, or all of it when it has fewer. */
export function firstRows(text: string, count: number): string {
  if (count <= 0) return '';
  const end = rowEndIndex(text, count);
  return end === -1 ? text : text.slice(0, end);
}

export const CSV_DELIMITERS = [
  { value: ',', label: 'Comma ( , )' },
  { value: ';', label: 'Semicolon ( ; )' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe ( | )' }
] as const;

/** The delimiter found most often outside quotes in the first row; a comma when none is. */
export function guessDelimiter(text: string): string {
  const firstRow = firstRows(text, 1);
  const counts = new Map<string, number>();
  let inQuotes = false;
  for (const char of firstRow) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes) counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let best: string = ',';
  let bestCount = 0;
  for (const { value } of CSV_DELIMITERS) {
    const count = counts.get(value) ?? 0;
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}
