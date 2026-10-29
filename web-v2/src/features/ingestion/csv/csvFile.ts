import { dropFirstRow, firstRows, splitCompleteRows } from './csvText.utils';

/**
 * Reading the file in the browser. Not papaparse: it decodes each slice on its own (`readAsText` per slice), so a
 * character split across two slices (any accented letter in UTF-8) is garbled. Here one `TextDecoder` streams over the
 * slices, and only complete rows are sent; the server parses them.
 */

/**
 * Bytes read per upload request, well under the server's 5 MB request limit. The local stack inserts about 600 rows a
 * second (1.7 ms a row, DI8), so a 1 MB chunk (16k short rows) ran past the 30 s timeout; 256 KB takes about 7 s.
 */
export const CHUNK_BYTES = 256 * 1024;
/** Bytes read for the preview; the rows past `PREVIEW_ROWS` are left out. */
export const SAMPLE_BYTES = 256 * 1024;
export const PREVIEW_ROWS = 100;

/** Labels `TextDecoder` knows. v1 offered ASCII and UTF-32, which browsers read as Windows-1252 and UTF-8. */
export const CSV_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
  { value: 'windows-1258', label: 'Windows-1258 (Vietnamese)' },
  { value: 'windows-1252', label: 'Windows-1252 (Western)' }
] as const;

export const DEFAULT_ENCODING = 'utf-8';

async function readBytes(file: Blob, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}

/**
 * The first rows of the file for `detect`: the header (when `includeHeader`) and up to `PREVIEW_ROWS` rows. A row cut
 * by the end of the sample is left out.
 */
export async function readSample(file: Blob, encoding: string, includeHeader: boolean): Promise<string> {
  const text = new TextDecoder(encoding).decode(await readBytes(file, 0, SAMPLE_BYTES));
  const rows = file.size <= SAMPLE_BYTES ? text : splitCompleteRows(text).complete;
  return firstRows(rows, PREVIEW_ROWS + (includeHeader ? 1 : 0));
}

/**
 * Turns the file's bytes, pushed in order, into text of complete rows. The rest of an unfinished row waits for the
 * next push; the header row is dropped from the first rows that come out.
 */
export class CsvChunkDecoder {
  private readonly decoder: TextDecoder;
  private rest = '';
  private headerPending: boolean;

  constructor(encoding: string, dropHeader: boolean) {
    this.decoder = new TextDecoder(encoding);
    this.headerPending = dropHeader;
  }

  /** The rows completed by `bytes`; with `last`, everything left. */
  push(bytes: Uint8Array, last: boolean): string {
    const text = this.rest + this.decoder.decode(bytes, { stream: !last });
    const { complete, rest } = last ? { complete: text, rest: '' } : splitCompleteRows(text);
    this.rest = rest;
    if (!this.headerPending || (complete === '' && !last)) return complete;
    this.headerPending = false;
    return dropFirstRow(complete);
  }
}

export function chunkCount(size: number, chunkBytes: number = CHUNK_BYTES): number {
  return Math.max(1, Math.ceil(size / chunkBytes));
}

export interface CsvChunkReader {
  /** Every chunk is a `chunkBytes` slice of the file, so the count is known before reading. */
  readonly total: number;
  /** The rows of the next chunk, possibly none (a row longer than a chunk). Call it `total` times, one at a time. */
  next(): Promise<string>;
}

export function csvChunkReader(
  file: Blob,
  options: { encoding: string; dropHeader: boolean; chunkBytes?: number }
): CsvChunkReader {
  const chunkBytes = options.chunkBytes ?? CHUNK_BYTES;
  const total = chunkCount(file.size, chunkBytes);
  const decoder = new CsvChunkDecoder(options.encoding, options.dropHeader);
  let index = 0;
  return {
    total,
    async next() {
      const start = index * chunkBytes;
      index += 1;
      return decoder.push(await readBytes(file, start, start + chunkBytes), index >= total);
    }
  };
}
