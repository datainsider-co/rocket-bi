import type { UserProfile } from '@/core/user/UserProfile';
import type { SuggestedUser } from '@/core/user/UserService';

/**
 * A user's attributes as v1 `RLSViewAsModal` lists them, `name = value`. v1 put the names in snake case; they are
 * shown as stored here, since that is how row level security rules name them.
 */
export function attributeChips(profile: Pick<UserProfile, 'properties'>): string[] {
  return Object.entries(profile.properties).map(([name, value]) => `${name} = ${value}`);
}

export function findUser(users: readonly SuggestedUser[], username: string | undefined): SuggestedUser | undefined {
  return username === undefined ? undefined : users.find(user => user.profile.username === username);
}
