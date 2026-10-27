import type { ResourceAction } from '@/core/permission/ResourcePermissionService';
import type { ResourceSharing } from '@/core/share/ResourceSharing';
import type { ShareResource } from '@/core/share/ShareService';
import { SHARE_LEVEL_ACTIONS, ShareLevel, shareLevelOf } from '@/core/share/shareLevel';
import type { UserProfile } from '@/core/user/UserProfile';

/**
 * The people edits waiting for Apply (v1 `ShareStore` createdUsers / editedUsers / revokedUsers). Only what the
 * viewer picked is kept; the changes to send are worked out against the server's sharing at Apply.
 */
export interface PeopleDraft {
  /** Users picked in the search, newest first, not shared yet. */
  added: readonly UserProfile[];
  /** The level picked per username, for shared and added users. */
  levels: Readonly<Record<string, ShareLevel>>;
}

export type PeopleDraftAction =
  | { type: 'add'; user: UserProfile }
  | { type: 'setLevel'; username: string; level: ShareLevel }
  | { type: 'reset' };

export const EMPTY_PEOPLE_DRAFT: PeopleDraft = { added: [], levels: {} };

export function peopleDraftReducer(draft: PeopleDraft, action: PeopleDraftAction): PeopleDraft {
  switch (action.type) {
    case 'add': {
      const { username } = action.user;
      if (draft.added.some(user => user.username === username)) return draft;
      // v1 adds a user with View.
      return { added: [action.user, ...draft.added], levels: { ...draft.levels, [username]: ShareLevel.View } };
    }
    case 'setLevel':
      return { ...draft, levels: { ...draft.levels, [action.username]: action.level } };
    case 'reset':
      return EMPTY_PEOPLE_DRAFT;
  }
}

/** One row of the people list. */
export interface PersonRow {
  user: UserProfile;
  level: ShareLevel;
  /** Picked in the search, not shared yet. */
  isNew: boolean;
}

/** Added users first (v1 put them on top), then the shared ones, each with the level picked or the server's. */
export function personRows(sharing: ResourceSharing | undefined, draft: PeopleDraft, resource: ShareResource): PersonRow[] {
  const shared = sharing?.usersSharing ?? [];
  const sharedNames = new Set(shared.map(item => item.user.username));
  const added = draft.added
    .filter(user => !sharedNames.has(user.username))
    .map(user => ({ user, level: draft.levels[user.username] ?? ShareLevel.View, isNew: true }));
  const existing = shared.map(item => ({
    user: item.user,
    level: draft.levels[item.user.username] ?? shareLevelOf(item.permissions, resource.type, resource.id),
    isNew: false
  }));
  return [...added, ...existing];
}

/** Usernames the search should leave out: the owner and everyone already in the list. */
export function listedUsernames(sharing: ResourceSharing | undefined, draft: PeopleDraft): Set<string> {
  const names = [...(sharing?.usersSharing ?? []).map(item => item.user.username), ...draft.added.map(user => user.username)];
  if (sharing?.owner.username) names.push(sharing.owner.username);
  return new Set(names);
}

/** The requests Apply sends for people: shares to create (by username), to edit (by share id) and to revoke. */
export interface PeopleChanges {
  create: Record<string, ResourceAction[]>;
  edit: Record<string, ResourceAction[]>;
  revoke: string[];
}

/**
 * What changed against the server's sharing. Unlike v1, a user set back to their current level sends nothing, and an
 * added user set to Remove access is simply not shared.
 */
export function peopleChanges(sharing: ResourceSharing | undefined, draft: PeopleDraft, resource: ShareResource): PeopleChanges {
  const changes: PeopleChanges = { create: {}, edit: {}, revoke: [] };
  for (const row of personRows(sharing, draft, resource)) {
    const { username } = row.user;
    if (row.isNew) {
      if (row.level !== ShareLevel.None) changes.create[username] = [...SHARE_LEVEL_ACTIONS[row.level]];
      continue;
    }
    const shared = sharing?.usersSharing.find(item => item.user.username === username);
    if (!shared || row.level === shareLevelOf(shared.permissions, resource.type, resource.id)) continue;
    if (row.level === ShareLevel.None) changes.revoke.push(username);
    else changes.edit[shared.id] = [...SHARE_LEVEL_ACTIONS[row.level]];
  }
  return changes;
}

export function hasPeopleChanges({ create, edit, revoke }: PeopleChanges): boolean {
  return Object.keys(create).length > 0 || Object.keys(edit).length > 0 || revoke.length > 0;
}
