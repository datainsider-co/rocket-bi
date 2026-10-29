import type { DirectoryService } from '@/core/directory/DirectoryService';
import type { ShareService } from '@/core/share/ShareService';
import type { LinkChange } from './link/shareLink.utils';
import type { PasswordChange } from './link/sharePassword.utils';
import type { SharePeopleApi } from './people/sharePeopleApi';
import type { PeopleChanges } from './people/sharePeople.utils';
import type { PeopleResource } from './share.utils';

/**
 * Everything Apply sends. A directory's id is also the one its password is stored on; a database has neither link nor
 * password.
 */
export interface SharePlan {
  resource: PeopleResource;
  people: PeopleChanges;
  link: LinkChange;
  password: PasswordChange;
}

export interface ShareDeps {
  peopleApi: SharePeopleApi;
  share: Pick<ShareService, 'revokeLink' | 'updateLink'>;
  directories: Pick<DirectoryService, 'setPassword'>;
}

/**
 * v1 `DiShareModal.done`: the people changes together, then the link, then the password. Each step only runs when it
 * has something to send; the first failure stops the rest.
 */
export async function applyShare({ resource, people, link, password }: SharePlan, { peopleApi, share, directories }: ShareDeps): Promise<void> {
  await Promise.all([
    Object.keys(people.create).length > 0 ? peopleApi.shareWithUsers(resource, people.create) : undefined,
    Object.keys(people.edit).length > 0 ? peopleApi.editShares(resource, people.edit) : undefined,
    people.revoke.length > 0 ? peopleApi.revokeShares(resource, people.revoke) : undefined
  ]);
  if (resource.type !== 'directory') return;
  if (link.kind === 'revoke') await share.revokeLink(resource);
  if (link.kind === 'update') await share.updateLink(resource, link.actions);
  if (password.kind === 'remove') await directories.setPassword(resource.id, undefined);
  if (password.kind === 'set') await directories.setPassword(resource.id, password.hashedPassword);
}
