import { PermissionTokenService } from '@core/common/services';
import { Di, TestModule } from '@core/common/modules';
import { Log } from '@core/utils';
import { HttpTestModule } from '@core/common/modules/TestHttpModule';

describe('Permission service for share link', () => {
  let permissionTokenService: PermissionTokenService;

  before(() => {
    Di.init([new HttpTestModule(), new TestModule()]);
    permissionTokenService = Di.get<PermissionTokenService>(PermissionTokenService);
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
