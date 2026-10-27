import { describe, expect, it } from 'vitest';
import { hashPassword } from './hashPassword';

describe('hashPassword', () => {
  it("matches v1's sha256 hex", () => {
    expect(hashPassword('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hashes unicode as utf-8', () => {
    expect(hashPassword('mật khẩu')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes an empty password', () => {
    expect(hashPassword('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
