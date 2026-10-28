import { describe, expect, it } from 'vitest';
import { portError, requiredError } from './fieldErrors';

describe('requiredError', () => {
  it.each([
    ['', 'Host is required!'],
    ['   ', 'Host is required!'],
    ['a', undefined]
  ])('%j → %s', (value, expected) => {
    expect(requiredError(value, 'Host')).toBe(expected);
  });
});

describe('portError', () => {
  it.each([
    ['', 'Port is required!'],
    [' ', 'Port is required!'],
    ['0', 'Port must be from 1 to 65535'],
    ['65536', 'Port must be from 1 to 65535'],
    ['-1', 'Port must be from 1 to 65535'],
    ['80.5', 'Port must be from 1 to 65535'],
    ['1e3', 'Port must be from 1 to 65535'],
    ['abc', 'Port must be from 1 to 65535'],
    ['1', undefined],
    [' 3306 ', undefined],
    ['65535', undefined]
  ])('%j → %s', (value, expected) => {
    expect(portError(value, 'Port')).toBe(expected);
  });
});
