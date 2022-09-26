import { RegisterResponse } from '@core/domain/Response/Authentication/RegisterResponse';
import { BaseClient } from '@core/services/base.service';
import { LoginByEmailRequest, SendCodeToEmailRequest, UserOAuthRequest, UserRegisterRequest } from '@core/domain/Request';
import { OauthConfigResponse } from '@core/domain/Model/OauthConfig/GoogleOauthConfig';
import { DIException } from '@core/domain/Exception';
import { OauthConfig } from '@core/domain/Model/OauthConfig/OauthConfig';
import { LoginResponse } from '@core/domain/Response/Authentication/LoginResponse';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';
import { UserProfile } from '@core/domain';

export abstract class AuthenticationRepository {
  abstract register(request: UserRegisterRequest): Promise<RegisterResponse>;

  abstract registerAndLogin(request: UserRegisterRequest): Promise<LoginResponse>;

  abstract login(request: LoginByEmailRequest): Promise<LoginResponse>;

  abstract checkSession(): Promise<LoginResponse>;

  abstract directVerify(token: string): Promise<LoginResponse>;

  abstract resetPassword(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract forgotPassword(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract changePassword(oldPass: string, newPass: string): Promise<boolean>;

  abstract loginOAuth(request: UserOAuthRequest): Promise<LoginResponse>;

  abstract resendEmail(request: SendCodeToEmailRequest): Promise<boolean>;

  abstract getPermissionsUser(tokenId: string): Promise<string[]>;

  abstract getLoginMethods(): Promise<OauthConfigResponse>;
}

export class HttpAuthenticationRepository implements AuthenticationRepository {
  private apiPath = '/user/auth';

  constructor(private httpClient: BaseClient) {}

  login(request: LoginByEmailRequest): Promise<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiPath}/login`, request);
  }

  register(request: UserRegisterRequest): Promise<RegisterResponse> {
    return this.httpClient.post<RegisterResponse>(`${this.apiPath}/register`, request);
  }

  registerAndLogin(request: UserRegisterRequest): Promise<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiPath}/fast_register`, request);
  }

  checkSession(): Promise<LoginResponse> {
    return this.httpClient.get<LoginResponse>(`${this.apiPath}/check_session`);
  }

  directVerify(token: string): Promise<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiPath}/direct_verify`, {
      token: token
    });
  }

  resetPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/reset_password`, request).then(() => true);
  }

  changePassword(oldPass: string, newPass: string): Promise<boolean> {
    return this.httpClient
      .put<BaseResponse>(`user/profile/change_password`, { newPass: newPass, oldPass: oldPass })
      .then(response => response.success);
  }

  forgotPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/forgot_password`, request).then(() => true);
  }

  loginOAuth(request: UserOAuthRequest): Promise<LoginResponse> {
    return this.httpClient.post(`${this.apiPath}/login_oauth`, request);
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
}

export class MockAuthenticationRepository implements AuthenticationRepository {
  getLoginMethods(): Promise<OauthConfigResponse> {
    return new Promise<OauthConfigResponse>(resolve => {
      throw new DIException('message', 200, '20000');
      // setTimeout(() => {
      //   const response: OauthConfigResponse = {
      //     gg: new OauthConfig('Google', OauthType.GOOGLE, ['datainsider.co', 'uit.edu.vn'], true),
      //     fb: new OauthConfig('Facebook', OauthType.FACEBOOK, ['datainsider', 'uit'], false)
      //   };
      //   resolve(response);
      // }, 5000);
    });
  }

  getPermissionsUser(tokenId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  login(request: LoginByEmailRequest): Promise<LoginResponse> {
    return new Promise<LoginResponse>(r => {
      r({
        session: {
          key: '1',
          value: '2',
          domain: '3',
          timeoutInMS: 4,
          maxAge: 5,
          path: '/'
        },
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        }),
        defaultOAuthCredential: true
      });
    });
  }

  register(request: UserRegisterRequest): Promise<RegisterResponse> {
    return new Promise<RegisterResponse>(r => {
      r({
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        })
      });
    });
  }

  registerAndLogin(request: UserRegisterRequest): Promise<LoginResponse> {
    return new Promise<LoginResponse>(r => {
      r({
        session: {
          key: '1',
          value: '2',
          domain: '3',
          timeoutInMS: 4,
          maxAge: 5,
          path: '/'
        },
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        }),
        defaultOAuthCredential: true
      });
    });
  }

  checkSession(): Promise<LoginResponse> {
    return new Promise<LoginResponse>(r => {
      r({
        session: {
          key: '1',
          value: '2',
          domain: '3',
          timeoutInMS: 4,
          maxAge: 5,
          path: '/'
        },
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        }),
        defaultOAuthCredential: true
      });
    });
  }

  directVerify(token: string): Promise<LoginResponse> {
    return new Promise<LoginResponse>(r => {
      r({
        session: {
          key: '1',
          value: '2',
          domain: '3',
          timeoutInMS: 4,
          maxAge: 5,
          path: '/'
        },
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        }),
        defaultOAuthCredential: true
      });
    });
  }

  resetPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return new Promise<boolean>(resolve => resolve(true));
  }

  forgotPassword(request: SendCodeToEmailRequest): Promise<boolean> {
    return new Promise<boolean>(resolve => resolve(true));
  }

  loginOAuth(request: UserOAuthRequest): Promise<LoginResponse> {
    return new Promise<LoginResponse>(r => {
      r({
        session: {
          key: '1',
          value: '2',
          domain: '3',
          timeoutInMS: 4,
          maxAge: 5,
          path: '/'
        },
        userInfo: {
          username: 'admin',
          roles: [1, 2],
          isActive: true,
          createdTime: 123,
          organization: {
            organizationId: 'default',
            domain: 'dev.datainsider.co',
            createdTime: 0,
            isActive: true,
            name: 'Data Insider',
            owner: 'stringabc',
            reportTimeZoneId: 'Asia/Saigon'
          }
        },
        userProfile: new UserProfile({
          username: 'admin',
          alreadyConfirmed: true,
          fullName: 'string',
          lastName: 'string',
          firstName: 'string',
          email: 'string@gmail.com',
          mobilePhone: '12312312',
          gender: 1,
          dob: 2,
          avatar: 'string',
          oauthType: 'string',
          properties: {},
          updatedTime: 1,
          createdTime: 2
        }),
        defaultOAuthCredential: true
      });
    });
  }

  resendEmail(request: SendCodeToEmailRequest): Promise<boolean> {
    return new Promise<boolean>(resolve => resolve(true));
  }

  changePassword(oldPass: string, newPass: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}
