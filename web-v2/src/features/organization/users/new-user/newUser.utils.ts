import { z } from 'zod';
import { UserGroup } from '@/core/admin/UserGroup';
import type { NewUser } from '@/core/admin/UserAdminService';
import { EDITOR_INITIAL_PERMISSIONS } from '@/core/admin/permissionGroups';

const PASSWORD_MIN_LENGTH = 6;

/** v1 `UserManagementModal` rules and messages. */
export const newUserSchema = z
  .object({
    email: z.string().trim().min(1, 'Email is required!').pipe(z.email('Invalid email format')),
    firstName: z.string().trim().min(1, 'First name is required!'),
    lastName: z.string().trim().min(1, 'Last name is required!'),
    userGroup: z.enum([UserGroup.Editor, UserGroup.Viewer]),
    password: z
      .string()
      .min(1, 'Password is required!')
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters!`),
    confirmPassword: z.string().min(1, 'Confirm password is required!')
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match!'
  });

export type NewUserForm = z.infer<typeof newUserSchema>;

/** v1 picked Viewer by default. */
export const DEFAULT_NEW_USER: NewUserForm = {
  email: '',
  firstName: '',
  lastName: '',
  userGroup: UserGroup.Viewer,
  password: '',
  confirmPassword: ''
};

export function toNewUser({ email, firstName, lastName, userGroup, password }: NewUserForm): NewUser {
  return { email, firstName, lastName, userGroup, password };
}

/** Granted right after creating: v1's Editor set; nothing for a Viewer (the server refuses v1's Viewer set). */
export function initialPermissions(userGroup: UserGroup): readonly string[] {
  return userGroup === UserGroup.Editor ? EDITOR_INITIAL_PERMISSIONS : [];
}

/** The server's `email_existed` reason, shown under the email like v1. */
export const EMAIL_EXISTED_REASON = 'email_existed';
export const EMAIL_EXISTED_MESSAGE = 'Your email already exists!';
