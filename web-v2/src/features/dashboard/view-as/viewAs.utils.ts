import type { SuggestedUser } from '@/core/user/UserService';

export interface UserOption {
  value: string;
  label: string;
  email: string;
}

/** The users to pick from, by username (v1 `RLSViewAsModal` suggestion list). */
export function userOptions(users: readonly SuggestedUser[]): UserOption[] {
  return users.map(({ profile }) => ({ value: profile.username, label: profile.displayName, email: profile.email }));
}

export function findUser(users: readonly SuggestedUser[], username: string | undefined): SuggestedUser | undefined {
  return username === undefined ? undefined : users.find(user => user.profile.username === username);
}
