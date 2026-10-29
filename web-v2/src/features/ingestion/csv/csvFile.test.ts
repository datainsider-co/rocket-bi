import { describe, expect, it } from 'vitest';
import { chunkCount, CsvChunkDecoder, csvChunkReader, PREVIEW_ROWS, readSample, SAMPLE_BYTES } from './csvFile';

const encoder = new TextEncoder();

async function readAll(file: Blob, options: Parameters<typeof csvChunkReader>[1]): Promise<string[]> {
  const reader = csvChunkReader(file, options);
  const chunks: string[] = [];
  for (let index = 0; index < reader.total; index++) chunks.push(await reader.next());
  return chunks;
}

describe('readSample', () => {
  it('reads a small file whole', async () => {
    await expect(readSample(new Blob(['id,name\n1,Á\n2,b']), 'utf-8', true)).resolves.toBe('id,name\n1,Á\n2,b');
  });

  it('drops the byte order mark', async () => {
    await expect(readSample(new Blob(['﻿id\n1\n']), 'utf-8', true)).resolves.toBe('id\n1\n');
  });

  it('decodes the encoding picked', async () => {
    const utf16 = new Uint8Array([0x61, 0x00, 0x0a, 0x00, 0xe1, 0x00]);
    await expect(readSample(new Blob([utf16]), 'utf-16le', false)).resolves.toBe('a\ná');
  });

  it(`keeps the header and ${PREVIEW_ROWS} rows`, async () => {
    const rows = Array.from({ length: PREVIEW_ROWS + 10 }, (_, index) => `${index}\n`).join('');
    const sample = await readSample(new Blob([`id\n${rows}`]), 'utf-8', true);
    expect(sample.split('\n')).toHaveLength(PREVIEW_ROWS + 2);
  });

  it('leaves out the row cut by the end of the sample', async () => {
    const big = `${'x'.repeat(SAMPLE_BYTES - 4)}\nabcdef\n`;
    const sample = await readSample(new Blob([big]), 'utf-8', false);
    expect(sample.endsWith('x\n')).toBe(true);
  });
});

describe('CsvChunkDecoder', () => {
  it('holds back an unfinished row until the next push', () => {
    const decoder = new CsvChunkDecoder('utf-8', false);
    expect(decoder.push(encoder.encode('1,a\n2,'), false)).toBe('1,a\n');
    expect(decoder.push(encoder.encode('b\n3,c'), true)).toBe('2,b\n3,c');
  });

  it('decodes a character split across two pushes', () => {
    const bytes = encoder.encode('1,Đơn\n');
    const decoder = new CsvChunkDecoder('utf-8', false);
    // `1,Đ` is 4 bytes and `ơ` 2: byte 5 is the middle of `ơ`.
    expect(decoder.push(bytes.slice(0, 5), false)).toBe('');
    expect(decoder.push(bytes.slice(5), true)).toBe('1,Đơn\n');
  });

  it('keeps a quoted line break inside its row', () => {
    const decoder = new CsvChunkDecoder('utf-8', false);
    expect(decoder.push(encoder.encode('1,"a\n'), false)).toBe('');
    expect(decoder.push(encoder.encode('b"\n2,c\n'), true)).toBe('1,"a\nb"\n2,c\n');
  });

  it('drops the header from the first rows that come out', () => {
    const decoder = new CsvChunkDecoder('utf-8', true);
    expect(decoder.push(encoder.encode('id,na'), false)).toBe('');
    expect(decoder.push(encoder.encode('me\n1,a\n'), false)).toBe('1,a\n');
    expect(decoder.push(encoder.encode('2,b\n'), true)).toBe('2,b\n');
  });

  it('drops a header that is the whole file', () => {
    expect(new CsvChunkDecoder('utf-8', true).push(encoder.encode('id,name'), true)).toBe('');
  });
});

describe('chunkCount', () => {
  it.each([
    [0, 1],
    [1, 1],
    [10, 1],
    [11, 2],
    [30, 3]
  ])('splits %i bytes into %i chunks of 10', (size, count) => {
    expect(chunkCount(size, 10)).toBe(count);
  });
});

describe('csvChunkReader', () => {
  it('reads every row once, across chunks', async () => {
    const text = 'id,name\n1,Á\n2,"b\nc"\n3,d\n';
    const chunks = await readAll(new Blob([text]), { encoding: 'utf-8', dropHeader: true, chunkBytes: 5 });
    expect(chunks).toHaveLength(chunkCount(encoder.encode(text).length, 5));
    expect(chunks.join('')).toBe('1,Á\n2,"b\nc"\n3,d\n');
  });

  it('reads an empty file as one empty chunk', async () => {
    await expect(readAll(new Blob([]), { encoding: 'utf-8', dropHeader: false })).resolves.toEqual(['']);
  });
});
