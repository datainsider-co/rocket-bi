import { describe, expect, it } from 'vitest';
import { fakeDatabaseShareService, fakeEtlShareService, fakeShareService } from '../testing';
import { sharePeopleApi } from './sharePeopleApi';

function setup() {
  const share = fakeShareService();
  const databases = fakeDatabaseShareService();
  const etls = fakeEtlShareService();
  return { share, databases, etls, api: sharePeopleApi(share, databases, etls) };
}

const directory = { type: 'directory', id: 7 } as const;
const database = { type: 'database', id: 'dw0_probe' } as const;
const etl = { type: 'etl', id: 1 } as const;

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

  it("uses the ETL's own endpoints, by id", async () => {
    const { share, databases, etls, api } = setup();

    await api.getSharing(etl);
    await api.shareWithUsers(etl, { u1: ['view'] });
    await api.editShares(etl, { s_2: ['view'] });
    await api.revokeShares(etl, ['u1']);

    expect(etls.getSharing).toHaveBeenCalledWith(1);
    expect(etls.shareWithUsers).toHaveBeenCalledWith(1, { u1: ['view'] });
    expect(etls.editShares).toHaveBeenCalledWith(1, { s_2: ['view'] });
    expect(etls.revokeShares).toHaveBeenCalledWith(1, ['u1']);
    expect(share.getSharing).not.toHaveBeenCalled();
    expect(databases.getSharing).not.toHaveBeenCalled();
  });
});
