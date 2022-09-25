import { UserRegisterRequest } from '@core/domain/Request/Authentication/UserRegisterRequest';
import { RegisterResponse } from '@core/domain/Response/Authentication/RegisterResponse';
import { AuthenticationRepository } from '@core/repositories/authentication.repository';
import { SendCodeToEmailRequest } from '@core/domain/Request/Authentication/SendCodeToEmailRequest';
import { UserOAuthRequest } from '@core/domain/Request/Authentication/UserOAuthRequest';
import { InjectValue } from 'typescript-ioc';
import { OauthConfigResponse } from '@core/domain/Model/OauthConfig/GoogleOauthConfig';
import { LoginResponse } from '@core/domain/Response/Authentication/LoginResponse';

export abstract class AuthenticationService {
  abstract register(request: UserRegisterRequest): Promise<RegisterResponse>;

  abstract fastRegister(request: UserRegisterRequest): Promise<LoginResponse>;

  abstract login(email: string, password: string, remember: boolean): Promise<LoginResponse>;

  abstract checkSession(): Promise<LoginResponse>;

  abstract directVerify(token: string): Promise<LoginResponse>;

  abstract resetPassword(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract changePassword(oldPass: string, newPass: string): Promise<boolean>;

  abstract forgotPassword(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract loginOAuth(request: UserOAuthRequest): Promise<LoginResponse>;

  abstract resendEmail(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract getLoginMethods(): Promise<OauthConfigResponse>;
}

export class AuthenticationServiceImpl implements AuthenticationService {
  constructor(private repository: AuthenticationRepository) {}

  login(email: string, password: string, remember: boolean): Promise<LoginResponse> {
    return this.repository.login({
      email: email,
      password: password,
      remember: remember
    });
  }

  register(request: UserRegisterRequest): Promise<RegisterResponse> {
    return this.repository.register(request);
  }

  fastRegister(request: UserRegisterRequest): Promise<LoginResponse> {
    return this.repository.registerAndLogin(request);
  }

  checkSession(): Promise<LoginResponse> {
    return this.repository.checkSession();
  }

  directVerify(token: string): Promise<LoginResponse> {
    return this.repository.directVerify(token);
  }

  resetPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.repository.resetPassword(request);
  }

  changePassword(oldPass: string, newPass: string): Promise<boolean> {
    return this.repository.changePassword(oldPass, newPass);
  }

  forgotPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.repository.forgotPassword(request);
  }

  loginOAuth(request: UserOAuthRequest): Promise<LoginResponse> {
    return this.repository.loginOAuth(request);
  }

  resendEmail(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.repository.resendEmail(request);
  }

  getLoginMethods(): Promise<OauthConfigResponse> {
    return this.repository.getLoginMethods();
  }
}
