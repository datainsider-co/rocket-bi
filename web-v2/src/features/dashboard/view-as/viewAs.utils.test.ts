import { describe, expect, it } from 'vitest';
import { UserProfile } from '@/core/user/UserProfile';
import { findUser, userOptions } from './viewAs.utils';

const user = (json: Record<string, unknown>) => ({ profile: new UserProfile(json), json });
const ann = user({ username: 'ann', full_name: 'Ann Lee', email: 'ann@x.io' });
const bob = user({ username: 'bob', email: 'bob@x.io' });

describe('userOptions', () => {
  it('labels users by name, falling back to the email', () => {
    expect(userOptions([ann, bob])).toEqual([
      { value: 'ann', label: 'Ann Lee', email: 'ann@x.io' },
      { value: 'bob', label: 'bob@x.io', email: 'bob@x.io' }
    ]);
    expect(userOptions([])).toEqual([]);
  });
});

describe('findUser', () => {
  it('finds the picked user', () => {
    expect(findUser([ann, bob], 'bob')).toBe(bob);
  });

  it('is undefined without a pick or a match', () => {
    expect(findUser([ann], undefined)).toBeUndefined();
    expect(findUser([ann], 'zed')).toBeUndefined();
  });
});
