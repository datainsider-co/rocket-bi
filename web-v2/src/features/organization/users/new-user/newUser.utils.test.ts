import { describe, expect, it } from 'vitest';
import { UserGroup } from '@/core/admin/UserGroup';
import { DEFAULT_NEW_USER, initialPermissions, newUserSchema, toNewUser } from './newUser.utils';

const valid = {
  ...DEFAULT_NEW_USER,
  email: ' a@b.co ',
  firstName: 'Ann',
  lastName: 'Lee',
  password: 'secret',
  confirmPassword: 'secret'
};

function errors(values: object): Record<string, string | undefined> {
  const result = newUserSchema.safeParse(values);
  if (result.success) return {};
  // The form shows the first message of each field, like zodResolver.
  return Object.fromEntries(result.error.issues.toReversed().map(issue => [issue.path.join('.'), issue.message]));
}

describe('newUserSchema', () => {
  it('accepts a complete form and trims the email and names', () => {
    const parsed = newUserSchema.parse({ ...valid, firstName: ' Ann ' });
    expect(parsed.email).toBe('a@b.co');
    expect(parsed.firstName).toBe('Ann');
  });

  it('requires every field', () => {
    expect(errors(DEFAULT_NEW_USER)).toMatchObject({
      email: 'Email is required!',
      firstName: 'First name is required!',
      lastName: 'Last name is required!',
      password: 'Password is required!',
      confirmPassword: 'Confirm password is required!'
    });
  });

  it('checks the email format', () => {
    expect(errors({ ...valid, email: 'nope' }).email).toBe('Invalid email format');
  });

  it('needs at least six characters of password', () => {
    expect(errors({ ...valid, password: '12345', confirmPassword: '12345' }).password).toMatch(/at least 6/);
  });

  it('needs the confirmation to match', () => {
    expect(errors({ ...valid, confirmPassword: 'other1' }).confirmPassword).toBe('Passwords do not match!');
  });
});

describe('toNewUser', () => {
  it('drops the confirmation', () => {
    expect(toNewUser(newUserSchema.parse(valid))).toEqual({
      email: 'a@b.co',
      firstName: 'Ann',
      lastName: 'Lee',
      userGroup: UserGroup.Viewer,
      password: 'secret'
    });
  });
});

describe('initialPermissions', () => {
  it('grants editors v1 starting set and viewers nothing', () => {
    expect(initialPermissions(UserGroup.Editor)).toEqual(['insight:*:*', 'query_analysis:*:*']);
    expect(initialPermissions(UserGroup.Viewer)).toEqual([]);
  });
});
