import dayjs from 'dayjs';
import { z } from 'zod';
import type { ProfileChanges } from '@/core/admin/UserAdminService';
import type { UserProfile } from '@/core/user/UserProfile';

/** v1 `UserGenders`: -1 is also what a profile without a gender holds. */
export const Gender = { Other: -1, Female: 0, Male: 1 } as const;

export const GENDER_OPTIONS = [
  { value: Gender.Female, label: 'Female' },
  { value: Gender.Male, label: 'Male' },
  { value: Gender.Other, label: 'Other' }
];

export function genderLabel(gender: number): string {
  return GENDER_OPTIONS.find(option => option.value === gender)?.label ?? 'Unknown';
}

const optionalUrl = z
  .string()
  .trim()
  .refine(value => value === '' || z.url().safeParse(value).success, 'Invalid URL');

/** One form for v1's inline fields; only what changed is sent. */
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required!'),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  mobilePhone: z.string().trim(),
  avatar: optionalUrl,
  gender: z.number(),
  /** Epoch millis of the date of birth; 0 when not set. */
  dob: z.number()
});

export type ProfileForm = z.infer<typeof profileSchema>;

export function toProfileForm(profile: UserProfile): ProfileForm {
  return {
    fullName: profile.fullName,
    firstName: profile.firstName,
    lastName: profile.lastName,
    mobilePhone: profile.mobilePhone,
    avatar: profile.avatar,
    gender: profile.gender,
    dob: profile.dob
  };
}

/** The fields that differ from `before`. */
export function profileChanges(before: ProfileForm, after: ProfileForm): ProfileChanges {
  const keys = Object.keys(after) as (keyof ProfileForm)[];
  return Object.fromEntries(keys.filter(key => before[key] !== after[key]).map(key => [key, after[key]])) as ProfileChanges;
}

/** v1 showed the date of birth as `MMM DD, YYYY`, in the browser's time zone; `--` when not set. */
export function formatBirthDate(dob: number): string {
  return dob ? dayjs(dob).format('MMM DD, YYYY') : '--';
}
