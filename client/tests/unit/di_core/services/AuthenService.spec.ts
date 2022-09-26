import { expect } from 'chai';
import { DevModule, DI, DIKeys, TestHttpModule, testModule } from '@core/modules';
import { AuthenticationService } from '@core/services/authentication.service';
import { RandomUtils } from '@/utils';

describe('DashboardService with data from server', () => {
  let noAuthenticationService: AuthenticationService;
  const emailName = RandomUtils.nextInt();

  before(() => {
    DI.init([new TestHttpModule(), new DevModule(), testModule]);
    noAuthenticationService = DI.get(DIKeys.noAuthService);
  });
  // it('Test login ', async () => {
  //   const login = await noAuthenticationService.login('thien0@dev.datainsider.com', '123456', true);
  //   expect(login).is.false;
  // });
  // it('Test Register ', async () => {
  //   const register = await noAuthenticationService.register({
  //     email: 'thien' + emailName.toString() + '@dev.datainsider.com',
  //     password: '1234567'
  //   });
  //   expect(register).be.ok;
  // });
  it('Test register and login ', async () => {
    // const emailName = RandomUtils.nextInt();
    // const registerAndLogin = await noAuthenticationService.fastRegister({
    //   email: 'thien' + emailName.toString() + '@dev.datainsider.com',
    //   password: '1234567'
    // });
    // expect(registerAndLogin).be.ok;
  });
  // it('Test check session', async () => {
  //   try {
  //     await noAuthenticationService.checkSession();
  //   } catch {
  //     expect;
  //   }
  // });
  // it('Test direct verify', async () => {
  //   try {
  //     const token = RandomUtils.nextInt() + RandomUtils.nextInt() + RandomUtils.nextInt() + RandomUtils.nextInt() + RandomUtils.nextInt();
  //     await noAuthenticationService.directVerify(`${token}`);
  //   } catch {
  //     expect;
  //   }
  // });
  // it('Test forgot password', async () => {
  //   const forgotPassword = await noAuthenticationService.forgotPassword({
  //     email: 'thien0@dev.datainsider.co'
  //   });
  //   expect(forgotPassword).is.true;
  // });
  it('Test OAuth login ', async () => {
    //
    //
  });
});
