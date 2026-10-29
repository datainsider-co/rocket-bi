import { describe, expect, it } from 'vitest';
import { fakeDatabaseShareService, fakeShareService } from '../testing';
import { sharePeopleApi } from './sharePeopleApi';

function setup() {
  const share = fakeShareService();
  const databases = fakeDatabaseShareService();
  return { share, databases, api: sharePeopleApi(share, databases) };
}

const directory = { type: 'directory', id: 7 } as const;
const database = { type: 'database', id: 'dw0_probe' } as const;

describe('sharePeopleApi', () => {
  it("uses the directory's share endpoints", async () => {
    const { share, databases, api } = setup();

    await api.getSharing(directory);
    await api.shareWithUsers(directory, { u1: ['view'] });
    await api.editShares(directory, { s_1: ['view'] });
    await api.revokeShares(directory, ['u1']);

    expect(share.getSharing).toHaveBeenCalledWith(directory, 0, 100);
    expect(share.shareWithUsers).toHaveBeenCalledWith(directory, { u1: ['view'] });
    expect(share.editShares).toHaveBeenCalledWith(directory, { s_1: ['view'] });
    expect(share.revokeShares).toHaveBeenCalledWith(directory, ['u1']);
    expect(databases.getSharing).not.toHaveBeenCalled();
  });

  it("uses the database's own endpoints, by name", async () => {
    const { share, databases, api } = setup();

    await api.getSharing(database);
    await api.shareWithUsers(database, { u1: ['view'] });
    await api.editShares(database, { s_5: ['view'] });
    await api.revokeShares(database, ['u1']);

    expect(databases.getSharing).toHaveBeenCalledWith('dw0_probe');
    expect(databases.shareWithUsers).toHaveBeenCalledWith('dw0_probe', { u1: ['view'] });
    expect(databases.editShares).toHaveBeenCalledWith('dw0_probe', { s_5: ['view'] });
    expect(databases.revokeShares).toHaveBeenCalledWith('dw0_probe', ['u1']);
    expect(share.getSharing).not.toHaveBeenCalled();
  });
});
