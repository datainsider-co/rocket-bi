<template>
  <BModal
    id="user-management-modal"
    centered
    class="rounded"
    size="lg"
    v-model="isShow"
    lazy
    ok-title="Add New User"
    cancel-title="Cancel"
    @ok="event => submitUser(user, event)"
    @cancel="cancel"
    :ok-disabled="loading"
    :cancel-disabled="loading"
  >
    <template #modal-header>
      <div>
        <h4 id="modal-title"><i class="di-icon-add"></i> Add New User</h4>
        <div id="modal-subtitle">
          Please enter the necessary information to access additional features.
        </div>
      </div>
    </template>

    <template #modal-footer>
      <div class="text-right d-flex align-items-center">
        <DiButton class=" btn-secondary" title="Cancel" @click="cancel"> </DiButton>
        <DiButton :disabled="loading" class=" btn-primary" title="Add New User" @click="event => submitUser(user, event)">
          <i v-if="loading" class="fa fa-spin fa-spinner"></i>
        </DiButton>
      </div>
    </template>

    <div id="user-management-body" :class="{ invalid: $v.$invalid }">
      <DiInputComponent2
        id="input-email"
        autofocus
        placeholder="user@datainsider.co"
        label="Email"
        v-model="user.email"
        type="email"
        require-icon
        :error="emailError"
      />
      <DiInputComponent2
        id="input-firstname"
        label="First Name"
        placeholder="Input first name..."
        v-model="user.firstName"
        require-icon
        :error="firstNameError"
      />
      <DiInputComponent2 id="input-lastname" label="Last Name" placeholder="Input last name..." v-model="user.lastName" require-icon :error="lastNameError" />
      <div id="role-dropdown">
        <label class="text-truncate">Role</label>
        <DiDropdownV2
          v-model="user.userGroup"
          :data="userGroupOptions"
          appendAtRoot
          boundary="window"
          label-props="displayName"
          value-props="id"
          placeholder="Select role"
        />
      </div>
      <DiInputComponent2
        is-password
        id="input-password"
        v-model="user.password"
        label="Password"
        placeholder="Input password..."
        type="password"
        autocomplete="new-password"
        :error="passwordErrorMessage"
        requireIcon
      />
      <DiInputComponent2
        v-model="user.confirmPassword"
        is-password
        id="input-re-password"
        label="Confirm Password"
        placeholder="Input confirm password..."
        type="password"
        autocomplete="new-password"
        :error="confirmPasswordErrorMessage"
        @enter="event => submitUser(user, event)"
        requireIcon
      />
    </div>
  </BModal>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator';
import { NewUserData } from '../AddNewUserModal.vue';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import { cloneDeep } from 'lodash';
import { email, minLength, required, sameAs } from 'vuelidate/lib/validators';
import { Log } from '@core/utils';
import { UserManagementModule } from '@/screens/user-management/store/UserManagementStore';
import { RegisterResponse } from '@core/common/domain';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import ErrorMessage from '@/screens/organization-settings/views/connector-config/ErrorMessage.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown';
import { ApiExceptions, SelectOption } from '@/shared';
import { UserGroup } from '@core/common/domain/model/user/UserGroup';

@Component({
  validations: {
    user: {
      firstName: { required },
      lastName: { required },
      email: { required, email },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs('password') }
    }
  },
  components: { DiDropdown, ErrorMessage, DiInputComponent2 }
})
export default class UserManagementModal extends Vue {
  private user: NewUserData = NewUserData.empty();
  private isShow = false;
  private loading = false;
  private errorMsg = '';
  private isEmailExisted = false;

  private callback: ((user: RegisterResponse) => void) | null = null;
  private failedCallback: ((message: string) => void) | null = null;

  private get userGroupOptions(): SelectOption[] {
    return [
      {
        id: UserGroup.Editor,
        displayName: 'Editor'
      },
      {
        id: UserGroup.Viewer,
        displayName: 'Viewer'
      }
      // {
      //   id: UserGroup.Editor,
      //   displayName: 'Editor'
      // }
    ];
  }

  show(user: NewUserData, onSubmitted: (user: RegisterResponse) => void, onFailure: (message: string) => void) {
    this.reset();
    this.callback = onSubmitted;
    this.failedCallback = onFailure;
    this.user = cloneDeep(user);
    this.isShow = true;
  }

  private reset() {
    this.$v.$reset();
    this.user = NewUserData.empty();
    this.isShow = false;
    this.loading = false;
    this.isEmailExisted = false;
    this.errorMsg = '';
    this.callback = null;
    this.failedCallback = null;
  }

  private async submitUser(user: NewUserData, event: Event) {
    try {
      event.preventDefault();
      if (this.valid()) {
        this.loading = true;
        const response: RegisterResponse = await UserManagementModule.createUser(user.toCreateUserRequest());
        const permissions: string[] = this.getPermissionsByRole(user.userGroup);
        await this.createBasicPermission(response, permissions);
        this.callback ? this.callback(response) : void 0;
        this.isShow = false;
      }
    } catch (ex) {
      Log.error(ex);
      if (ex.reason === ApiExceptions.emailExisted) {
        this.isEmailExisted = true;
        return;
      }
      this.failedCallback ? this.failedCallback(ex.message) : void 0;
      this.isShow = false;
    } finally {
      this.loading = false;
    }
  }

  @Watch('user.email')
  onEmailChanged() {
    this.isEmailExisted = false;
  }

  private async createBasicPermission(registerResponse: RegisterResponse, permission: string[]) {
    UserDetailModule.setSelectedUsername({ username: registerResponse.userInfo.username });
    await UserDetailModule.loadSupportPermissionGroups();
    UserDetailModule.setSelectedPermissions({ newSelectedPermissions: permission });
    await UserDetailModule.savePermissions();
  }

  private valid(): boolean {
    this.$v.$touch();
    return !this.$v.$invalid;
  }

  private cancel() {
    this.reset();
    this.isShow = false;
  }

  private get firstNameError(): string {
    if (!this.$v.user.firstName?.$error) {
      return '';
    }
    if (!this.$v.user.firstName?.required) {
      return 'First Name is required!';
    }

    return '';
  }

  private get lastNameError(): string {
    if (!this.$v.user.lastName?.$error) {
      return '';
    }
    if (!this.$v.user.lastName?.required) {
      return 'Last Name is required!';
    }

    return '';
  }

  private get emailError(): string {
    if (this.isEmailExisted) {
      return 'Your email already exists!';
    }
    if (!this.$v.user?.email?.$error) {
      return '';
    }
    if (!this.$v.user?.email?.required) {
      return 'Email is required!';
    }
    return 'Invalid email format';
  }

  private get confirmPasswordErrorMessage(): string {
    if (!this.$v.user?.confirmPassword?.$error) {
      return '';
    }
    if (!this.$v.user?.confirmPassword?.required) {
      return 'Confirm Password is required!';
    }

    if (!this.$v.user?.rePassword?.sameAsPassword) {
      return 'Confirm Password not correct!';
    }
    return '';
  }

  private get passwordErrorMessage(): string {
    if (!this.$v.user?.password?.$error) {
      return '';
    }
    if (!this.$v.user?.password?.required) {
      return 'Password is required!';
    }

    if (!this.$v.user?.password?.minLength) {
      return 'Password must be at least 6 characters!';
    }
    return '';
  }

  private getPermissionsByRole(userGroup: UserGroup) {
    switch (userGroup) {
      case UserGroup.Editor:
        return ['insight:*:*', 'query_analysis:*:*'];
      case UserGroup.Viewer:
        return ['insight:*:view', 'query_analysis:*:view'];
      case UserGroup.None:
        return [];
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#user-management-modal {
  @include regular-text();

  .modal-header {
    padding: 12px 20px 0 20px !important;

    #modal-title {
      font-size: 22px;
      font-style: normal;
      font-weight: 500;
      line-height: 150%; /* 33px */
      i {
        height: 1rem;
        width: 1rem;
        font-size: 1rem;
        margin-right: 0.5rem;
      }
    }

    #modal-subtitle {
      color: #8e8e93;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 140%; /* 19.6px */
    }
  }

  .modal-body {
    max-height: 450px;
    padding: 22px 20px !important;
    overflow: auto;

    #user-management-body {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(33.33%, 1fr));

      gap: 1.25rem;

      &.invalid {
        gap: 1rem;
      }

      #role-dropdown {
        display: flex;
        flex-direction: column;

        label {
          margin-bottom: 0.25rem;
        }

        .select-container-v2 {
          --blue-light: #0066ff;
          margin-top: 0;

          &.open {
            > .relative > span > button {
              box-shadow: 0 0 0 2px var(--blue-light);

              &:hover {
                box-shadow: 0 0 0 2px var(--blue-light);
              }
            }
          }

          > .relative > span > button {
            height: 40px;
            border-radius: 4px;
            border: unset;
            box-shadow: 0 0 0 1px #d6d6d6;

            &:hover {
              box-shadow: 0 0 0 1px var(--blue-light);
            }
          }
        }
      }
    }

    transition: height 1s;

    #error-message {
      animation: fadeIn 2s ease-in both;
      margin-top: 1rem;
    }
  }

  .modal-footer {
    padding: 0.75rem 1.25rem !important;

    .btn-primary {
      padding: 11.5px 36px;
      margin: 0;
    }

    .btn-secondary {
      padding: 10.5px 17.5px;
      margin: 0;
    }

    .di-button + .di-button {
      margin-left: 12px;
    }
  }
}
</style>
