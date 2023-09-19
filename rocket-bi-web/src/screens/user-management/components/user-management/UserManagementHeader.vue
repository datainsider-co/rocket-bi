<template>
  <div class="user-management-header">
    <div class="user-search-input-container">
      <SearchInput id="search-users-management" :timeBound="300" hintText="Search users..." @onTextChanged="handleChangeKeyword"></SearchInput>
    </div>
    <DiIconTextButton id="setting-login-methods" title="Login Method" @click="toggleLoginSettingsModal">
      <i class="di-icon-setting"></i>
    </DiIconTextButton>
    <DiIconTextButton id="add-new-user" title="New User" @click="handleOnClickNewUser">
      <i class="di-icon-add"></i>
    </DiIconTextButton>
    <DiIconTextButton id="refresh" title="Refresh" @click="handleClickRefresh">
      <i class="di-icon-reset"></i>
    </DiIconTextButton>
    <AddNewUserModal ref="addNewUserModal"></AddNewUserModal>
    <UserManagementModal ref="userManagementModal" />
    <LoginSettingsModal ref="loginSettingsModal"></LoginSettingsModal>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import AddNewUserModal, { NewUserData } from '@/screens/user-management/components/user-management/AddNewUserModal.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import LoginSettingsModal from '@/screens/user-management/components/user-management/LoginSettingsModal.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { UserManagementModule } from '@/screens/user-management/store/UserManagementStore';
import SearchInput from '@/shared/components/SearchInput.vue';
import UserManagementModal from './add-new-user/UserManagementModal.vue';
import { PopupUtils } from '@/utils';
import { RegisterResponse } from '@core/common/domain';
import { Routers } from '@/shared';
import Swal from 'sweetalert2';

@Component({
  components: { SearchInput, DiSearchInput, DiButton, AddNewUserModal, LoginSettingsModal, UserManagementModal }
})
export default class UserManagementHeader extends Vue {
  $alert!: typeof Swal;
  private keyword = '';

  @Ref()
  private addNewUserModal!: AddNewUserModal;

  @Ref()
  private loginSettingsModal!: LoginSettingsModal;

  @Ref()
  private readonly userManagementModal!: UserManagementModal;

  @Track(TrackEvents.CreateUser)
  private handleOnClickNewUser() {
    // this.addNewUserModal.show();
    const newUserData = NewUserData.empty();
    this.userManagementModal.show(newUserData, this.handleCreatedUser, this.showErrorMessageModal);
  }

  @Track(TrackEvents.UserManagementRefresh)
  private handleClickRefresh() {
    UserManagementModule.setKeyword({ keyword: '' });
    this.$emit('reload', false);
  }

  @Track(TrackEvents.UserManagementSettingLogin)
  private toggleLoginSettingsModal() {
    this.loginSettingsModal.show();
  }

  @Watch('keyword')
  private handleChangeKeyword(newKeyword: string) {
    UserManagementModule.setKeyword({ keyword: newKeyword });
    this.$emit('reload', false);
  }

  private async handleCreatedUser(response: RegisterResponse) {
    UserManagementModule.setFrom({ from: 0 });
    await this.$router.push({
      name: Routers.UserDetail,
      params: {
        username: response.userProfile.username
      }
    });
  }
  private async showErrorMessageModal(message: string) {
    await this.$alert.fire({
      icon: 'error',
      title: 'Create new user failed!',
      text: message,
      confirmButtonText: 'OK',
      showCancelButton: false
    });
  }
}
</script>
<style lang="scss">
.user-management-header {
  display: flex;
  align-items: center;
  flex-direction: row;

  .user-search-input-container {
    padding: 0 8px;
    margin-right: 8px;
    background: var(--secondary);
    border-radius: 4px;

    input {
      background: var(--secondary);
    }
  }

  #search-users-management {
    //flex: 1;
    width: 275px;
  }

  @media screen and (max-width: 650px) {
    #search-users-management {
      display: none;
    }

    .di-btn-icon-text .title {
      display: none;
    }
  }

  > .di-btn-icon-text i {
    font-size: 16px;
  }

  > .di-btn-icon-text + .di-btn-icon-text {
    margin-left: 8px;
  }
}
</style>
