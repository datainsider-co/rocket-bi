import { describe, expect, it } from 'vitest';
import { avatarColor } from './avatarColor';

describe('avatarColor', () => {
  it('picks by the first letter, ignoring case', () => {
    // 'R' is 82; 82 % 19 = 6.
    expect(avatarColor('root')).toBe('#27ae60');
    expect(avatarColor('Root')).toBe(avatarColor('root'));
  });

  it('falls back to the first color for an empty name', () => {
    expect(avatarColor('')).toBe('#1abc9c');
  });
});
