<template>
  <DiCustomModal ref="customModal" ok-title="Add New User" size="small" hide-header-close title="Add New User" @onClickOk="handleClickOk">
    <div class="new-user-body">
      <div class="form-input-item">
        <FormInput
          :id="genInputId('first-name')"
          placeholder="First Name"
          :is-error="$v.newUserData.firstName.$error"
          :input-value="newUserData.firstName"
          @handleChangeInputValue="handleChangeFirstName"
          @enter="handleClickOk"
        />
        <template v-if="$v.newUserData.firstName.$error">
          <div v-if="!$v.newUserData.firstName.required" class="error-text mr-auto warning">First Name is required</div>
        </template>
      </div>
      <div class="form-input-item">
        <FormInput
          :id="genInputId('last-name')"
          placeholder="Last Name"
          :is-error="$v.newUserData.lastName.$error"
          :input-value="newUserData.lastName"
          @handleChangeInputValue="handleChangeLastName"
          @enter="handleClickOk"
        />
        <template v-if="$v.newUserData.lastName.$error">
          <div v-if="!$v.newUserData.lastName.required" class="error-text mr-auto warning">Last Name is required</div>
        </template>
      </div>
      <div class="form-input-item">
        <InputEmail
          :id="genInputId('email')"
          class="custom-input-email"
          :isError="$v.newUserData.email.$error"
          placeholder="Email"
          @onEmailChanged="handleChangeEmail"
          @enter="handleClickOk"
        ></InputEmail>
        <template v-if="$v.newUserData.email.$error">
          <div v-if="!$v.newUserData.email.required" class="warning">Email is required</div>
          <div v-if="!$v.newUserData.email.email" class="warning">Invalid email</div>
        </template>
      </div>
      <div class="form-input-item">
        <InputPass
          :id="genInputId('password', 1)"
          class="custom-input-pass"
          :isError="$v.newUserData.password.$error"
          placeholder="Password"
          @onPasswordChanged="handleChangePassword"
          @enter="handleClickOk"
        ></InputPass>
        <template v-if="$v.newUserData.password.$error">
          <div v-if="!$v.newUserData.password.required" class="warning">Password is required</div>
          <div v-if="!$v.newUserData.password.minLength" class="warning">Password must at least 6 characters</div>
        </template>
      </div>
      <div class="form-input-item">
        <InputPass
          :id="genInputId('password', 2)"
          class="custom-input-pass"
          :isError="$v.newUserData.confirmPassword.$error"
          placeholder="Confirm Password"
          @onPasswordChanged="handleChangeConfirmPassword"
          @enter="handleClickOk"
        ></InputPass>
        <template v-if="$v.newUserData.confirmPassword.$error">
          <div v-if="!$v.newUserData.confirmPassword.required" class="warning">Confirm Password is required</div>
          <div v-else-if="!$v.newUserData.confirmPassword.sameAsPassword" class="warning">Confirm Password does not match</div>
        </template>
      </div>
      <div v-if="isLoading || isError" class="mt-2">
        <DiLoading v-if="isLoading"></DiLoading>
        <pre v-if="isError" class="warning">{{ errorMessage }}</pre>
      </div>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import InputPass from '@/screens/login/components/input-components/InputPass.vue';
import InputEmail from '@/screens/login/components/input-components/InputEmail.vue';
import FormInput from '@/screens/user-management/components/user-management/FormInput.vue';
import { CreateUserRequest } from '@core/admin/domain/request/CreateUserRequest';
import { email, minLength, required, sameAs } from 'vuelidate/lib/validators';
import { Routers, Status } from '@/shared';
import { DIException } from '@core/common/domain/exception';
import { UserManagementModule } from '@/screens/user-management/store/UserManagementStore';
import { Log } from '@core/utils';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { RegisterResponse } from '@core/common/domain';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import { UserGroup } from '@core/common/domain/model/user/UserGroup';

export class NewUserData {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public password: string,
    public confirmPassword: string,
    public userGroup: UserGroup
  ) {}

  static empty(): NewUserData {
    return new NewUserData('', '', '', '', '', UserGroup.Viewer);
  }

  toCreateUserRequest(): CreateUserRequest {
    return new CreateUserRequest(this.email, this.password, `${this.firstName} ${this.lastName}`, this.firstName, this.lastName, this.userGroup);
  }
}

//Todo refactor validate
@Component({
  components: { DiLoading, InputEmail, InputPass, DiCustomModal, FormInput },
  validations: {
    newUserData: {
      firstName: { required },
      lastName: { required },
      email: { required, email },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs('password') }
    }
  }
})
export default class AddNewUserModal extends Vue {
  private newUserData: NewUserData = NewUserData.empty();
  private errorMessage = '';

  private status = Status.Loaded;

  @Ref()
  private customModal!: DiCustomModal;

  show() {
    this.customModal.show();
    this.resetData();
  }

  hide() {
    this.customModal.hide();
    this.resetData();
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  @Track(TrackEvents.SubmitCreateUser, {
    user_first_name: (_: AddNewUserModal, args: any) => _.newUserData.firstName,
    user_last_name: (_: AddNewUserModal, args: any) => _.newUserData.lastName,
    user_email: (_: AddNewUserModal, args: any) => _.newUserData.email
  })
  private handleClickOk(event: MouseEvent) {
    // prevent close modal
    event.preventDefault();
    if (this.isAddNewUser()) {
      this.status = Status.Loading;
      this.addNewUser(this.newUserData).then(status => {
        if (status) {
          this.hide();
        }
      });
    }
  }

  private isAddNewUser(): boolean {
    // TODO: validate here
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private async addNewUser(newUserData: NewUserData): Promise<boolean> {
    return UserManagementModule.createUser(newUserData.toCreateUserRequest())
      .then(async resp => {
        await this.createBasicPermission(resp);
        UserManagementModule.setFrom({ from: 0 });
        // a UserManagementModule.loadUserProfileListing();
        this.status = Status.Loaded;
        await this.$router.push({
          name: Routers.UserDetail,
          params: {
            username: resp.userProfile.username
          }
        });
        return true;
      })
      .catch(e => {
        const error = DIException.fromObject(e);
        Log.debug('Error Add new User::', error.message);
        this.errorMessage = error.message;
        this.status = Status.Error;
        return false;
      });
  }

  private async createBasicPermission(registerResponse: RegisterResponse) {
    try {
      UserDetailModule.setSelectedUsername({ username: registerResponse.userInfo.username });
      await UserDetailModule.loadSupportPermissionGroups();
      UserDetailModule.setSelectedPermissions({ newSelectedPermissions: ['insight:*:*', 'cdp:*:*', 'query_analysis:*:*'] });
      await UserDetailModule.savePermissions();
    } catch (e) {
      Log.error('AddNewUserModal::createBasicPermission::error', e.message);
    }
  }

  private resetData() {
    this.newUserData = NewUserData.empty();
    this.errorMessage = '';
    this.status = Status.Loaded;
    this.$v.$reset();
  }

  private handleChangePassword(newPassword: string, error: boolean) {
    this.newUserData.password = newPassword;
  }

  private handleChangeConfirmPassword(newConfirmPassword: string, error: boolean) {
    this.newUserData.confirmPassword = newConfirmPassword;
  }

  private handleChangeEmail(newEmail: string, error: boolean) {
    this.newUserData.email = newEmail;
  }

  private handleChangeFirstName(newFirstName: string) {
    this.newUserData.firstName = newFirstName;
  }

  private handleChangeLastName(newLastName: string) {
    this.newUserData.lastName = newLastName;
  }

  @Watch('newUserData.email')
  handleResetEmailError() {
    this.$v.newUserData.email?.$reset();
  }

  @Watch('newUserData.password')
  handleResetPasswordError() {
    this.$v.newUserData.password?.$reset();
  }

  @Watch('newUserData.confirmPassword')
  handleResetConfirmPasswordError() {
    this.$v.newUserData.confirmPassword?.$reset();
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.new-user-body {
  display: flex;
  flex-direction: column;

  .form-input-item + .form-input-item {
    margin-top: 8px;
  }

  .form-input-item {
    > .input-box {
      padding: 0 !important;
    }
  }

  .custom-input-email,
  .custom-input-pass,
  .custom-input-pass {
    margin: 0 !important;
    padding: 0;
    position: relative;
    opacity: 1;

    label {
      display: none;
    }

    input.form-control {
      min-height: 40px;
      margin: 0;
      background-color: var(--input-background-color);

      @include regular-text(0.2px, var(--secondary-text-color));
      cursor: text;

      &::placeholder {
        @include regular-text(0.2px, var(--secondary-text-color));
        opacity: 0.6;
      }
    }

    span.show-pass {
      top: 10px;
      bottom: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      i {
        opacity: 1;
        font-size: 14px;
      }
    }

    span.email-span {
      top: 0;
      bottom: 0;
      right: 0;
      width: 40px;
      height: 40px;
      margin: 0;

      img {
        width: 40px;
        height: 40px;
        object-fit: cover;
      }
    }
  }

  pre {
    white-space: pre-wrap;
    margin-bottom: 0;
  }

  .error-text,
  .warning {
    margin-top: 4px;
    color: var(--danger);
  }
}
</style>
