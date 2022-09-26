import { PermissionTokenService } from '@core/services';
import { DevModule, DI, TestHttpModule, testModule } from '@core/modules';
import { expect } from 'chai';
import { Log } from '@core/utils';

describe('Permission service for share link', () => {
  let permissionTokenService: PermissionTokenService;

  before(() => {
    DI.init([new TestHttpModule(), new DevModule(), testModule]);
    permissionTokenService = DI.get<PermissionTokenService>(PermissionTokenService);
    Log.debug('permissionTokenService is PermissionTokenService::', permissionTokenService instanceof PermissionTokenService);
  });

  const tokenId = 'ff211ed2-b837-4af6-937f-1e86efc9d92f';
  const newPermissions = ['dashboard:123:edit'];
  it('get token info', async () => {
    // const response = await permissionTokenService.getTokenInfo(tokenId);
    // expect(response).is.has.exist;
  });

  it('update token', async () => {
    // const response = await permissionTokenService.updateToken(tokenId, newPermissions);
    // expect(response).is.true;
  });

  it('isPermitted', async () => {
    // const response = await permissionTokenService.isPermitted(tokenId, newPermissions);
    // expect(response).is.true;
  });

  it('isPermittedAll', async () => {
    // const response = await permissionTokenService.updateToken(tokenId, newPermissions);
    // expect(response).is.true;
  });

  // it('delete token', async () => {
  //   const response = await permissionTokenService.deleteToken(tokenId);
  //   expect(response).is.true
  // })
});
