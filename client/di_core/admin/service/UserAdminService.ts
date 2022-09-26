import { UsersResponse } from '@core/domain/Response/User/UsersResponse';
import { Inject } from 'typescript-ioc';
import { UserAdminRepository } from '@core/admin/repository/UserAdminRepository';
import { CreateUserRequest } from '@core/admin/domain/request/CreateUserRequest';
import { UserFullDetailInfo, UserProfile } from '@core/domain/Model';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';
import { DeleteUserRequest } from '@core/admin/domain/request/TransferUserDataConfig';
import { RegisterResponse } from '@core/domain/Response';
import { SearchUserRequest } from '@core/admin/domain/request/SearchUserRequest';
import { UserSearchResponse } from '@core/domain/Response/User/UserSearchResponse';
import { EditUserPropertyRequest } from '@core/admin/domain/request/EditUserPropertyRequest';

export abstract class UserAdminService {
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
}

export class UserAdminServiceImpl implements UserAdminService {
  @Inject
  userRepository!: UserAdminRepository;

  create(newUserData: CreateUserRequest): Promise<RegisterResponse> {
    return this.userRepository.create(newUserData);
  }

  getUserFullDetailInfo(username: string): Promise<UserFullDetailInfo> {
    return this.userRepository.getUserFullDetailInfo(username);
  }

  editUserProfile(request: EditUserProfileRequest): Promise<UserProfile> {
    return this.userRepository.editUserProfile(request);
  }

  activate(username: string): Promise<boolean> {
    return this.userRepository.activate(username);
  }

  deactivate(username: string): Promise<boolean> {
    return this.userRepository.deactivate(username);
  }

  search(from: number, size: number, isActive: boolean): Promise<UsersResponse> {
    return this.userRepository.search(from, size, isActive);
  }

  searchV2(from: number, size: number, keyword: string, isActive?: boolean): Promise<UserSearchResponse> {
    return this.userRepository.searchV2(from, size, keyword, isActive);
  }

  delete(request: DeleteUserRequest): Promise<boolean> {
    return this.userRepository.delete(request);
  }

  getSuggestedUsers(request: SearchUserRequest): Promise<UsersResponse> {
    return this.userRepository.getSuggestedUsers(request);
  }

  updateUserProperties(request: EditUserPropertyRequest): Promise<UserProfile> {
    return this.userRepository.updateUserProperties(request);
  }
}
