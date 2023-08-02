import { RegisterResponse } from '@core/common/domain/response/authentication/RegisterResponse';
import { BaseClient } from '@core/common/services/HttpClient';
import { LoginByEmailRequest, SendCodeToEmailRequest, UserOAuthRequest, UserRegisterRequest } from '@core/common/domain/request';
import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { OauthConfig } from '@core/common/domain/model/oauth-config/OauthConfig';
import { LoginResponse } from '@core/common/domain/response/authentication/LoginResponse';
import { UserResetPasswordRequest } from '@core/common/domain/request/authentication/UserResetPasswordRequest';
import { BaseResponse } from '@core/common/domain';

export abstract class AuthenticationRepository {
  abstract register(request: UserRegisterRequest): Promise<RegisterResponse>;

  abstract registerAndLogin(request: UserRegisterRequest): Promise<LoginResponse>;

  abstract login(request: LoginByEmailRequest): Promise<LoginResponse>;

  abstract checkSession(): Promise<LoginResponse>;

  abstract directVerify(token: string): Promise<LoginResponse>;

  abstract resetPassword(request: UserResetPasswordRequest): Promise<boolean>;

  abstract forgotPassword(email: string): Promise<boolean>;

  abstract changePassword(oldPass: string, newPass: string): Promise<boolean>;

  abstract loginOAuth(request: UserOAuthRequest): Promise<LoginResponse>;

  abstract resendEmail(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract getPermissionsUser(tokenId: string): Promise<string[]>;

  abstract getLoginMethods(): Promise<OauthConfigResponse>;

  abstract validCode(payload: { email: string; code: string }): Promise<boolean>;
}

export class HttpAuthenticationRepository implements AuthenticationRepository {
  private apiPath = '/user/auth';

  constructor(private httpClient: BaseClient) {}

  login(request: LoginByEmailRequest): Promise<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiPath}/login`, request).then(response => LoginResponse.fromObject(response));
  }

  register(request: UserRegisterRequest): Promise<RegisterResponse> {
    return this.httpClient.post<RegisterResponse>(`${this.apiPath}/register`, request);
  }

  registerAndLogin(request: UserRegisterRequest): Promise<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiPath}/fast_register`, request).then(response => LoginResponse.fromObject(response));
  }

  checkSession(): Promise<LoginResponse> {
    return this.httpClient.get<LoginResponse>(`${this.apiPath}/check_session`).then(response => LoginResponse.fromObject(response));
  }

  directVerify(token: string): Promise<LoginResponse> {
    return this.httpClient
      .post<LoginResponse>(`${this.apiPath}/direct_verify`, {
        token: token
      })
      .then(response => LoginResponse.fromObject(response));
  }

  resetPassword(request: UserResetPasswordRequest): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/reset_password`, request).then(() => true);
  }

  changePassword(oldPass: string, newPass: string): Promise<boolean> {
    return this.httpClient
      .put<BaseResponse>(`user/profile/change_password`, { newPass: newPass, oldPass: oldPass })
      .then(response => response.success);
  }

  forgotPassword(email: string): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/forgot_password`, { email }).then(() => true);
  }

  loginOAuth(request: UserOAuthRequest): Promise<LoginResponse> {
    return this.httpClient.post(`${this.apiPath}/login_oauth`, request).then(response => LoginResponse.fromObject(response));
  }

  resendEmail(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/verify/send_code`, request).then(() => true);
  }

  getPermissionsUser(tokenId: string): Promise<string[]> {
    return this.httpClient.get(`/user/permissions/me`);
  }

  getLoginMethods(): Promise<OauthConfigResponse> {
    return this.httpClient.get<OauthConfigResponse>(`${this.apiPath}/login_methods`).then(obj => {
      const response: OauthConfigResponse = {};
      Object.entries(obj).forEach(([key, value]) => {
        response[key] = OauthConfig.fromObject(value);
      });
      return response;
    });
  }

  validCode(payload: { email: string; code: string }): Promise<boolean> {
    const { email, code } = payload;
    return this.httpClient
      .post(`/user/auth/${code}/status`, {
        email: email
      })
      .then(res => (res as any).success);
  }
}
