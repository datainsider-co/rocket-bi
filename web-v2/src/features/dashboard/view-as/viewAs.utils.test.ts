import { describe, expect, it } from 'vitest';
import { UserProfile } from '@/core/user/UserProfile';
import { attributeChips, findUser } from './viewAs.utils';

const user = (json: Record<string, unknown>) => ({ profile: new UserProfile(json), json });
const ann = user({ username: 'ann', full_name: 'Ann Lee', email: 'ann@x.io' });
const bob = user({ username: 'bob', email: 'bob@x.io' });

describe('attributeChips', () => {
  it('lists the attributes by their stored names', () => {
    expect(attributeChips(new UserProfile({ properties: { 'team.region': 'Asia', Level: '3' } }))).toEqual(['team.region = Asia', 'Level = 3']);
    expect(attributeChips(ann.profile)).toEqual([]);
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
