import { UsersResponse } from '@core/common/domain/response/user/UsersResponse';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { CreateUserRequest } from '@core/admin/domain/request/CreateUserRequest';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';
import { UserFullDetailInfo, UserProfile } from '@core/common/domain/model';
import { DeleteUserRequest } from '@core/admin/domain/request/TransferUserDataConfig';
import { RegisterResponse } from '@core/common/domain/response';
import { SearchUserRequest } from '@core/admin/domain/request/SearchUserRequest';
import { UserSearchResponse } from '@core/common/domain/response/user/UserSearchResponse';
import { EditUserPropertyRequest } from '@core/admin/domain/request/EditUserPropertyRequest';
import { UserGroup } from '@core/common/domain/model/user/UserGroup';

export abstract class UserAdminRepository {
  abstract create(newUser: CreateUserRequest): Promise<RegisterResponse>;

  abstract getUserFullDetailInfo(username: string): Promise<UserFullDetailInfo>;

  abstract editUserProfile(request: EditUserProfileRequest): Promise<UserProfile>;

  abstract activate(username: string): Promise<boolean>;

  abstract deactivate(username: string): Promise<boolean>;

  abstract search(from: number, size: number, isActive: boolean): Promise<UsersResponse>;

  abstract searchV2(from: number, size: number, keyword: string, isActive?: boolean): Promise<UserSearchResponse>;

  abstract delete(request: DeleteUserRequest): Promise<boolean>;

  abstract getSuggestedUsers(request: SearchUserRequest): Promise<UsersResponse>;

  abstract updateUserProperties(request: EditUserPropertyRequest): Promise<UserProfile>;

  abstract updateRole(username: string, role: UserGroup): Promise<boolean>;

  abstract resetPassword(username: string): Promise<boolean>;
}

export class UserAdminRepositoryImpl extends UserAdminRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;

  create(request: CreateUserRequest): Promise<RegisterResponse> {
    return this.httpClient.post(`/admin/users/create`, request, undefined).then(obj => RegisterResponse.fromObject(obj));
  }

  getUserFullDetailInfo(username: string): Promise<UserFullDetailInfo> {
    return this.httpClient.get(`/admin/users/${username}`).then(response => {
      return UserFullDetailInfo.fromObject(response);
    });
  }

  editUserProfile(request: EditUserProfileRequest): Promise<UserProfile> {
    return this.httpClient.put(`/admin/users/${request.username}`, request).then(response => {
      return UserProfile.fromObject(response);
    });
  }

  activate(username: string): Promise<boolean> {
    return this.httpClient.post(`/admin/users/${username}/activate`);
  }

  deactivate(username: string): Promise<boolean> {
    return this.httpClient.post(`/admin/users/${username}/deactivate`);
  }

  /**
   * Deprecated
   * Use searchV2 instead.
   * @param from
   * @param size
   * @param isActive
   */
  search(from: number, size: number, isActive: boolean): Promise<UsersResponse> {
    const params = {
      from: from,
      size: size,
      // eslint-disable-next-line @typescript-eslint/camelcase
      is_active: isActive
    };
    return this.httpClient.post(`/admin/users/search`, undefined, params).then(data => {
      return UsersResponse.fromObject(data);
    });
  }

  searchV2(from: number, size: number, keyword: string, isActive?: boolean): Promise<UserSearchResponse> {
    const params = {
      from: from,
      size: size,
      keyword,
      // eslint-disable-next-line @typescript-eslint/camelcase
      is_active: isActive
    };
    return this.httpClient.post(`/admin/users/search/v2`, undefined, params).then(data => {
      return UserSearchResponse.fromObject(data);
    });
  }

  delete(request: DeleteUserRequest): Promise<boolean> {
    return this.httpClient.delete(`/user-data/${request.username}`, request, undefined).then((res: any) => res.success);
  }

  getSuggestedUsers(request: SearchUserRequest): Promise<UsersResponse> {
    return this.httpClient.post<UsersResponse>(`user/profile/suggest`, request).then(
      res =>
        new UsersResponse(
          res.data.map(user => UserProfile.fromObject(user)),
          res.total
        )
    );
  }

  updateUserProperties(request: EditUserPropertyRequest): Promise<UserProfile> {
    return this.httpClient.put(`/admin/users/${request.username}/property`, request).then(res => UserProfile.fromObject(res));
  }

  resetPassword(username: string): Promise<boolean> {
    return this.httpClient
      .put<{
        isSuccess: boolean;
      }>(`/admin/users/${username}/reset_password`)
      .then(res => res.isSuccess);
  }

  updateRole(userName: string, role: UserGroup): Promise<boolean> {
    return this.httpClient.post(`/admin/permissions/${userName}/group`, { userGroup: role }).then((res: any) => res.isSuccess);
  }
}
