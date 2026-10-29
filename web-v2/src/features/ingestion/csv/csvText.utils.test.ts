import { describe, expect, it } from 'vitest';
import { dropFirstRow, firstRows, guessDelimiter, splitCompleteRows } from './csvText.utils';

describe('splitCompleteRows', () => {
  it('keeps the rows that ended and returns the rest', () => {
    expect(splitCompleteRows('a,b\n1,2\n3,')).toEqual({ complete: 'a,b\n1,2\n', rest: '3,' });
  });

  it('keeps everything when the text ends with a line feed', () => {
    expect(splitCompleteRows('a\nb\n')).toEqual({ complete: 'a\nb\n', rest: '' });
  });

  it('returns no complete row when no row ended', () => {
    expect(splitCompleteRows('a,b')).toEqual({ complete: '', rest: 'a,b' });
  });

  it('returns nothing for empty text', () => {
    expect(splitCompleteRows('')).toEqual({ complete: '', rest: '' });
  });

  it('does not end a row at a line feed inside quotes', () => {
    expect(splitCompleteRows('1,"multi\nline"\n2,"open\n')).toEqual({ complete: '1,"multi\nline"\n', rest: '2,"open\n' });
  });

  it('reads doubled quotes inside quotes as text', () => {
    expect(splitCompleteRows('1,"say ""hi""\n"\n2')).toEqual({ complete: '1,"say ""hi""\n"\n', rest: '2' });
  });

  it('ends a row at \\r\\n, keeping the \\r with it', () => {
    expect(splitCompleteRows('a\r\nb')).toEqual({ complete: 'a\r\n', rest: 'b' });
  });
});

describe('dropFirstRow', () => {
  it('drops the header row', () => {
    expect(dropFirstRow('id,name\n1,a\n')).toBe('1,a\n');
  });

  it('drops a header with a quoted line break', () => {
    expect(dropFirstRow('"first\nname",x\n1,2')).toBe('1,2');
  });

  it('returns nothing when the text is only an unfinished row', () => {
    expect(dropFirstRow('id,name')).toBe('');
  });

  it('returns nothing for empty text', () => {
    expect(dropFirstRow('')).toBe('');
  });
});

describe('firstRows', () => {
  it('returns the first rows', () => {
    expect(firstRows('a\nb\nc\n', 2)).toBe('a\nb\n');
  });

  it('returns all of the text when it has fewer rows', () => {
    expect(firstRows('a\nb', 5)).toBe('a\nb');
  });

  it('counts a quoted line break as part of the row', () => {
    expect(firstRows('"x\ny"\nz\n', 1)).toBe('"x\ny"\n');
  });

  it.each([0, -1])('returns nothing for %i rows', count => {
    expect(firstRows('a\nb', count)).toBe('');
  });
});

describe('guessDelimiter', () => {
  it.each([
    ['id,name,price\n1,a,2', ','],
    ['id;name;price\n1;a;2', ';'],
    ['id\tname\tprice', '\t'],
    ['id|name|price', '|']
  ])('finds the delimiter of %j', (text, delimiter) => {
    expect(guessDelimiter(text)).toBe(delimiter);
  });

  it('only reads the first row', () => {
    expect(guessDelimiter('a;b\n1,2,3,4,5')).toBe(';');
  });

  it('ignores delimiters inside quotes', () => {
    expect(guessDelimiter('"a,b,c";d;e')).toBe(';');
  });

  it.each(['single', ''])('falls back to a comma for %j', text => {
    expect(guessDelimiter(text)).toBe(',');
  });
});
