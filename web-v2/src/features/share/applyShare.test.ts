import { describe, expect, it, vi } from 'vitest';
import type { ShareService } from '@/core/share/ShareService';
import type { SharePlan } from './applyShare';
import { applyShare } from './applyShare';
import { sharePeopleApi } from './people/sharePeopleApi';
import { fakeDatabaseShareService, fakeShareService } from './testing';

const resource = { type: 'directory', id: 8 } as const;
const NOTHING: SharePlan = {
  resource,
  people: { create: {}, edit: {}, revoke: [] },
  link: { kind: 'keep' },
  password: { kind: 'keep' }
};

function setup() {
  const calls: string[] = [];
  const track = (name: string) => async () => void calls.push(name);
  const share = fakeShareService({
    shareWithUsers: vi.fn<ShareService['shareWithUsers']>(track('create')),
    editShares: vi.fn<ShareService['editShares']>(track('edit')),
    revokeShares: vi.fn<ShareService['revokeShares']>(track('revoke')),
    updateLink: vi.fn<ShareService['updateLink']>(track('updateLink')),
    revokeLink: vi.fn<ShareService['revokeLink']>(track('revokeLink'))
  });
  const directories = { setPassword: vi.fn<(id: number, hashedPassword: string | undefined) => Promise<void>>(track('password')) };
  const databases = fakeDatabaseShareService();
  const deps = { peopleApi: sharePeopleApi(share, databases), share, directories };
  return { share, databases, directories, deps, calls };
}

describe('applyShare', () => {
  it('sends nothing for an empty plan', async () => {
    const { deps, calls } = setup();
    await applyShare(NOTHING, deps);
    expect(calls).toEqual([]);
  });

  it('sends people changes, then the link, then the password', async () => {
    const { share, directories, deps, calls } = setup();
    await applyShare(
      {
        resource,
        people: { create: { ann: ['view'] }, edit: { s_1: ['view', 'download'] }, revoke: ['dan'] },
        link: { kind: 'update', actions: ['view', 'download'] },
        password: { kind: 'set', hashedPassword: 'ab' }
      },
      deps
    );
    expect(calls.slice(0, 3).sort()).toEqual(['create', 'edit', 'revoke']);
    expect(calls.slice(3)).toEqual(['updateLink', 'password']);
    expect(share.shareWithUsers).toHaveBeenCalledWith(resource, { ann: ['view'] });
    expect(share.editShares).toHaveBeenCalledWith(resource, { s_1: ['view', 'download'] });
    expect(share.revokeShares).toHaveBeenCalledWith(resource, ['dan']);
    expect(share.updateLink).toHaveBeenCalledWith(resource, ['view', 'download']);
    expect(directories.setPassword).toHaveBeenCalledWith(8, 'ab');
  });

  it('revokes the link and removes the password', async () => {
    const { directories, deps, calls } = setup();
    await applyShare({ ...NOTHING, link: { kind: 'revoke' }, password: { kind: 'remove' } }, deps);
    expect(calls).toEqual(['revokeLink', 'password']);
    expect(directories.setPassword).toHaveBeenCalledWith(8, undefined);
  });

  it('stops at the first failure', async () => {
    const { share, deps } = setup();
    vi.mocked(share.revokeShares).mockRejectedValue(new Error('Target user is not an editor'));
    await expect(
      applyShare({ ...NOTHING, people: { create: {}, edit: {}, revoke: ['dan'] }, link: { kind: 'revoke' } }, deps)
    ).rejects.toThrow('Target user is not an editor');
    expect(share.revokeLink).not.toHaveBeenCalled();
  });

  it("shares a database with people only, through the database's endpoints", async () => {
    const { share, databases, directories, deps, calls } = setup();
    await applyShare(
      {
        resource: { type: 'database', id: 'dw0_probe' },
        people: { create: { ann: ['view'] }, edit: {}, revoke: [] },
        link: { kind: 'revoke' },
        password: { kind: 'remove' }
      },
      deps
    );
    expect(databases.shareWithUsers).toHaveBeenCalledWith('dw0_probe', { ann: ['view'] });
    expect(share.shareWithUsers).not.toHaveBeenCalled();
    expect(directories.setPassword).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});
