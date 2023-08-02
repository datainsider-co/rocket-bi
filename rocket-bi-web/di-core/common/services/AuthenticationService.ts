import { UserRegisterRequest } from '@core/common/domain/request/authentication/UserRegisterRequest';
import { RegisterResponse } from '@core/common/domain/response/authentication/RegisterResponse';
import { AuthenticationRepository } from '@core/common/repositories/AuthenticationRepository';
import { SendCodeToEmailRequest } from '@core/common/domain/request/authentication/SendCodeToEmailRequest';
import { UserOAuthRequest } from '@core/common/domain/request/authentication/UserOAuthRequest';
import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { LoginResponse } from '@core/common/domain/response/authentication/LoginResponse';
import { UserResetPasswordRequest } from '@core/common/domain/request/authentication/UserResetPasswordRequest';

export abstract class AuthenticationService {
  abstract register(request: UserRegisterRequest): Promise<RegisterResponse>;

  abstract fastRegister(request: UserRegisterRequest): Promise<LoginResponse>;

  abstract login(email: string, password: string, remember: boolean): Promise<LoginResponse>;

  abstract checkSession(): Promise<LoginResponse>;

  abstract directVerify(token: string): Promise<LoginResponse>;

  abstract resetPassword(request: UserResetPasswordRequest): Promise<boolean>;

  abstract changePassword(oldPass: string, newPass: string): Promise<boolean>;

  abstract forgotPassword(email: string): Promise<boolean>;

  abstract loginOAuth(request: UserOAuthRequest): Promise<LoginResponse>;

  abstract resendEmail(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract getLoginMethods(): Promise<OauthConfigResponse>;

  abstract validCode(payload: { email: string; code: string }): Promise<boolean>;
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

  resetPassword(request: UserResetPasswordRequest): Promise<boolean> {
    return this.repository.resetPassword(request);
  }

  changePassword(oldPass: string, newPass: string): Promise<boolean> {
    return this.repository.changePassword(oldPass, newPass);
  }

  forgotPassword(email: string): Promise<boolean> {
    return this.repository.forgotPassword(email);
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

  validCode(payload: { email: string; code: string }): Promise<boolean> {
    return this.repository.validCode(payload);
  }
}
