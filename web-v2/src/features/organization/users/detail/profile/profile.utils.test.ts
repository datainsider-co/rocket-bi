import { describe, expect, it } from 'vitest';
import { UserProfile } from '@/core/user/UserProfile';
import { formatBirthDate, genderLabel, profileChanges, profileSchema, toProfileForm } from './profile.utils';

const profile = new UserProfile({
  username: 'u',
  full_name: 'Ann Lee',
  first_name: 'Ann',
  last_name: 'Lee',
  mobile_phone: '1',
  gender: 0,
  dob: 946684800000,
  avatar: ''
});

describe('genderLabel', () => {
  it.each([
    [0, 'Female'],
    [1, 'Male'],
    [-1, 'Other'],
    [5, 'Unknown']
  ])('%s → %s', (gender, label) => {
    expect(genderLabel(gender)).toBe(label);
  });
});

describe('toProfileForm', () => {
  it('reads the editable fields', () => {
    expect(toProfileForm(profile)).toEqual({
      fullName: 'Ann Lee',
      firstName: 'Ann',
      lastName: 'Lee',
      mobilePhone: '1',
      avatar: '',
      gender: 0,
      dob: 946684800000
    });
  });
});

describe('profileSchema', () => {
  it('requires a name', () => {
    expect(profileSchema.safeParse({ ...toProfileForm(profile), fullName: ' ' }).success).toBe(false);
  });

  it('accepts an empty avatar or a URL, not other text', () => {
    expect(profileSchema.safeParse({ ...toProfileForm(profile), avatar: '' }).success).toBe(true);
    expect(profileSchema.safeParse({ ...toProfileForm(profile), avatar: 'https://x.io/a.png' }).success).toBe(true);
    expect(profileSchema.safeParse({ ...toProfileForm(profile), avatar: 'not a url' }).success).toBe(false);
  });
});

describe('profileChanges', () => {
  it('is empty when nothing changed', () => {
    const form = toProfileForm(profile);
    expect(profileChanges(form, { ...form })).toEqual({});
  });

  it('keeps only the changed fields, cleared ones included', () => {
    const form = toProfileForm(profile);
    expect(profileChanges(form, { ...form, mobilePhone: '', gender: 1 })).toEqual({ mobilePhone: '', gender: 1 });
  });
});

describe('formatBirthDate', () => {
  it('formats a set date and shows -- otherwise', () => {
    expect(formatBirthDate(new Date(2000, 0, 15).getTime())).toBe('Jan 15, 2000');
    expect(formatBirthDate(0)).toBe('--');
  });
});
