import { UserAdminService } from '@core/admin/service/UserAdminService';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { UserProfileTableRow } from '@/shared/interfaces/UserProfileTableRow';
import moment from 'moment';
import { CreateUserRequest } from '@core/admin/domain/request/CreateUserRequest';
import { UserGenders, UserProfile } from '@core/common/domain/model';
import { RegisterResponse } from '@core/common/domain/response';
import { UserSearchResponse } from '@core/common/domain/response/user/UserSearchResponse';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { SyncMode } from '@core/data-ingestion';

export interface UserProfileListingState {
  userProfileTableRows: UserProfileTableRow[];
  from: number;
  size: number;
  totalProfile: number;
}

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.userProfileListingStore })
class UserManagementStore extends VuexModule {
  from: UserProfileListingState['from'] = 0;
  size: UserProfileListingState['size'] = 0;
  keyword = '';
  userProfileTableRows: UserProfileListingState['userProfileTableRows'] = [];
  totalProfile: UserProfileListingState['totalProfile'] = 0;

  @Inject
  private userManagementService!: UserAdminService;

  get profileHeaders(): HeaderData[] {
    return [
      {
        key: 'index',
        label: ' ',
        disableSort: true,
        width: 60
      },
      {
        key: 'fullName',
        label: 'Owner',
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('avatar', ['fullName'], true)
      },
      {
        key: 'firstName',
        label: 'First Name',
        disableSort: true
      },
      {
        key: 'lastName',
        label: 'Last Name',
        disableSort: true
      },
      {
        key: 'email',
        label: 'Email',
        disableSort: true
      },
      {
        key: 'isActive',
        label: 'Status',
        customRenderBodyCell: new CustomCell((rowData, rowIndex, header, columnIndex) => {
          const status = rowData?.isActive ?? '--';
          const activeEle = `<div class="active-status">Active</div>`;
          const suspendedEle = `<div class="suspended-status">Suspended</div>`;
          if (status === 'Active') {
            return HtmlElementRenderUtils.renderHtmlAsElement(activeEle);
          } else {
            return HtmlElementRenderUtils.renderHtmlAsElement(suspendedEle);
          }
        }),
        width: 100,
        disableSort: true
      }
    ];
  }

  static toUserProfileTableRows(userResponse: UserSearchResponse, from: number): UserProfileTableRow[] {
    const dateFormatStyle = 'MMM, DD YYYY HH:mm:ss';
    const dateFormatStyle2 = 'MMM, DD YYYY';
    return userResponse.data.map((userFullDetail, index) => {
      const user = userFullDetail.user;
      const userProfile = userFullDetail.profile ?? UserProfile.fromObject({});
      return {
        index: from + index + 1, //key of row
        username: user.username,
        fullName: userProfile.getName,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        mobilePhone: userProfile.mobilePhone,
        gender: UserGenders.toDisplayName(userProfile.gender ?? UserGenders.Other),
        dob: userProfile.dob ? moment(userProfile.dob).format(dateFormatStyle2) : '',
        avatar: userProfile.avatar,
        updatedTime: userProfile.createdTime ? moment(userProfile.updatedTime).format(dateFormatStyle) : '',
        createdTime: userProfile.createdTime ? moment(userProfile.createdTime).format(dateFormatStyle) : '',
        isActive: user.isActive ? 'Active' : 'Suspended'
      } as UserProfileTableRow;
    });
  }

  @Action({ rawError: true })
  loadUserProfileListing(): Promise<void> {
    return this.userManagementService.searchV2(this.from, this.size, this.keyword, undefined).then(resp => {
      if (resp) {
        this.setUserSearchData({ data: resp.data, total: resp.total });
      }
    });
  }

  @Mutation
  setUserSearchData(userResponse: UserSearchResponse) {
    this.totalProfile = userResponse.total;
    this.userProfileTableRows = UserManagementStore.toUserProfileTableRows(userResponse, this.from);
  }

  @Action({ rawError: true })
  createUser(createUserRequest: CreateUserRequest): Promise<RegisterResponse> {
    return this.userManagementService.create(createUserRequest);
  }

  @Mutation
  setFromAndSize(payload: { from: number; size: number }) {
    this.from = payload.from;
    this.size = payload.size;
  }

  @Mutation
  setFrom(payload: { from: number }) {
    this.from = payload.from;
  }

  @Mutation
  setKeyword(payload: { keyword: string }) {
    this.keyword = payload.keyword;
  }

  @Mutation
  reset() {
    this.keyword = '';
    this.userProfileTableRows = [];
  }
}

export const UserManagementModule = getModule(UserManagementStore);
