import type { DirectoryService } from '@/core/directory/DirectoryService';
import type { ShareResource, ShareService } from '@/core/share/ShareService';
import type { LinkChange } from './link/shareLink.utils';
import type { PasswordChange } from './link/sharePassword.utils';
import type { PeopleChanges } from './people/sharePeople.utils';

/** Everything Apply sends. The resource is a directory, so its id is also the one the password is stored on. */
export interface SharePlan {
  resource: ShareResource;
  people: PeopleChanges;
  link: LinkChange;
  password: PasswordChange;
}

export interface ShareDeps {
  share: ShareService;
  directories: Pick<DirectoryService, 'setPassword'>;
}

/**
 * v1 `DiShareModal.done`: the people changes together, then the link, then the password. Each step only runs when it
 * has something to send; the first failure stops the rest.
 */
export async function applyShare({ resource, people, link, password }: SharePlan, { share, directories }: ShareDeps): Promise<void> {
  await Promise.all([
    Object.keys(people.create).length > 0 ? share.shareWithUsers(resource, people.create) : undefined,
    Object.keys(people.edit).length > 0 ? share.editShares(resource, people.edit) : undefined,
    people.revoke.length > 0 ? share.revokeShares(resource, people.revoke) : undefined
  ]);
  if (link.kind === 'revoke') await share.revokeLink(resource);
  if (link.kind === 'update') await share.updateLink(resource, link.actions);
  if (password.kind === 'remove') await directories.setPassword(resource.id, undefined);
  if (password.kind === 'set') await directories.setPassword(resource.id, password.hashedPassword);
}
