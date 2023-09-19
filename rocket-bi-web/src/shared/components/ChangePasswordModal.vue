<template>
  <BModal
    id="change-password-modal"
    ref="modal"
    centered
    cancel-title="Cancel"
    ok-title="Confirm"
    :hide-header="true"
    @ok="handleChangePassword"
    @shown="onShown"
  >
    <!--    <form>-->
    <div class="change-password-modal-body ">
      <div class="modal-title mar-left-16">Change Password</div>
      <InputPass
        :id="genInputId('current-password')"
        class="input-pass"
        label="Current Password"
        placeholder="Current password"
        ref="inputCurrentPassword"
        @enter="handleChangePassword"
        @onPasswordChanged="handleCurrentPasswordChange"
      />
      <div v-if="$v.currentPassword.$error" class="text-danger mt-2 mar-left-16 mr-3">
        <div v-if="!$v.currentPassword.required">Current password is required</div>
        <div v-else-if="!$v.currentPassword.minLength">Current password must at least 6 characters</div>
      </div>
      <InputPass
        :id="genInputId('new-password')"
        class="input-pass"
        label="New Password"
        placeholder="New password"
        @enter="handleChangePassword"
        @onPasswordChanged="handleNewPasswordChange"
      />
      <div v-if="$v.newPassword.$error" class="text-danger mt-2 mar-left-16 mr-3">
        <div v-if="!$v.newPassword.required">New password is required</div>
        <div v-else-if="!$v.newPassword.minLength">New password must at least 6 characters</div>
        <div v-else-if="!$v.newPassword.notSameCurrentPassword">New password can not be the same as current password</div>
      </div>
      <InputPass
        :id="genInputId('confirm-password')"
        class="input-pass"
        label="Confirm New Password"
        placeholder="Confirm new password"
        @enter="handleChangePassword"
        @onPasswordChanged="handleConfirmPasswordChange"
      />
      <div v-if="$v.confirmPassword.$error" class="text-danger mt-2 mar-left-16 mr-3">
        <div v-if="!$v.confirmPassword.required">Confirm password is required.</div>
        <div v-else-if="!$v.confirmPassword.sameAsPassword">Confirm password does not match.</div>
      </div>
      <div class="d-flex align-items-center mt-2 mar-left-16 mr-3">
        <!--          <div v-if="isLoadingStatus" class="spinner">-->
        <!--            <BSpinner small class="text-center"></BSpinner>-->
        <!--          </div>-->
        <div v-if="isErrorStatus" class="text-danger ">
          {{ errorSubmitFormMessage }}
        </div>
      </div>
    </div>
    <!--    </form>-->
  </BModal>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomModal from './DiCustomModal.vue';
import InputPass from '@/screens/login/components/input-components/InputPass.vue';
import { minLength, required, sameAs } from 'vuelidate/lib/validators';
import { Log } from '@core/utils';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { AtomicAction } from '@core/common/misc';
import { Status } from '@/shared';

@Component({
  components: { InputPass, DiCustomModal },
  validations: {
    currentPassword: { required, minLength: minLength(6) },
    newPassword: {
      required,
      minLength: minLength(6),
      notSameCurrentPassword(val, { currentPassword }) {
        return val !== currentPassword;
      }
    },
    confirmPassword: { required, sameAsPassword: sameAs('newPassword') }
  }
})
export default class ChangePasswordModal extends Vue {
  private currentPassword = '';
  private newPassword = '';
  private confirmPassword = '';
  private errorSubmitFormMessage = '';
  private submitStatus = Status.Loaded;

  @Ref()
  modal?: DiCustomModal;

  @Ref()
  inputCurrentPassword?: InputPass;

  private get isErrorStatus() {
    return this.submitStatus === Status.Error;
  }

  private get isLoadingStatus() {
    return this.submitStatus === Status.Loading;
  }

  show() {
    this.modal?.show();
    this.initModal();
  }

  onShown() {
    this.inputCurrentPassword?.focusInput();
  }

  hide() {
    this.modal?.hide();
  }

  private handleCurrentPasswordChange(newValue: string) {
    try {
      this.currentPassword = newValue;
    } catch (e) {
      Log.error('ChangePasswordModal::handleCurrentPasswordChange::error::', e.message);
    }
  }

  private handleNewPasswordChange(newValue: string) {
    try {
      this.newPassword = newValue;
    } catch (e) {
      Log.error('ChangePasswordModal::handleNewPasswordChange::error::', e.message);
    }
  }

  private handleConfirmPasswordChange(newValue: string) {
    try {
      this.confirmPassword = newValue;
    } catch (e) {
      Log.error('ChangePasswordModal::handleConfirmPasswordChange::error::', e.message);
    }
  }

  private async handleChangePassword(event: Event) {
    try {
      this.preventHideModal(event);
      this.submitStatus = Status.Loading;
      await this.changePassword();
      this.submitStatus = Status.Loaded;
    } catch (e) {
      this.setError(e.message);
      Log.error('ChangePasswordModal::handleSubmitModal::error::', e.message);
    }
  }

  private preventHideModal(event: Event) {
    event.preventDefault();
  }

  @AtomicAction()
  private async changePassword() {
    if (this.isValidForm) {
      const isChangedPasswordSuccess = await AuthenticationModule.changePassword({ oldPass: this.currentPassword, newPass: this.newPassword });
      if (isChangedPasswordSuccess) {
        this.hide();
      } else {
        this.setError("Can't change password.");
      }
    }
  }

  private get isValidForm() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  @Watch('currentPassword')
  resetCurrentPasswordInputError() {
    try {
      if (this.$v.currentPassword.$error) {
        this.$v.currentPassword?.$reset();
      }
    } catch (e) {
      Log.error('ChangePasswordModal::resetCurrentPasswordInputError::error', e.message);
    }
  }

  @Watch('newPassword')
  resetNewPasswordInputError() {
    try {
      if (this.$v.newPassword.$error) {
        this.$v.newPassword?.$reset();
      }
    } catch (e) {
      Log.error('ChangePasswordModal::resetNewPasswordInputError::error', e.message);
    }
  }

  @Watch('confirmPassword')
  resetConfirmPasswordInputError() {
    try {
      if (this.$v.confirmPassword.$error) {
        this.$v.confirmPassword?.$reset();
      }
    } catch (e) {
      Log.error('ChangePasswordModal::resetNewPasswordInputError::error', e.message);
    }
  }

  initModal() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.submitStatus = Status.Loaded;
    this.$v.$reset();
  }

  setError(message: string) {
    this.submitStatus = Status.Error;
    this.errorSubmitFormMessage = message;
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
.change-password-modal-body {
  .mar-left-16 {
    margin-left: 8px;
  }

  .modal-title {
    @include regular-text();
    font-size: 24px;
    margin-bottom: 26px;
  }

  .spinner {
    height: 21px;
  }

  .input-pass {
    width: 100%;
    ::v-deep {
      max-height: 66px;
      background: none;
      margin: 16px 0;
      padding: 0 8px;
      opacity: 1;

      label {
      }
      input {
        color: var(--secondary-text-color);
        background-color: var(--input-background-color);

        &:-ms-input-placeholder {
          opacity: 0.5;
        }
        &::-webkit-input-placeholder {
          opacity: 0.5;
        }
        &::placeholder {
          opacity: 0.5;
        }
      }

      //  margin-top: 24px !important;
      .show-pass {
        bottom: 10px;

        .fas {
          opacity: 1;
        }
        i {
          color: var(--secondary-text-color);
        }
      }
    }
  }
}

::v-deep {
  .modal-dialog {
    max-width: 448px;
  }
  .modal-footer {
    width: 100%;
    padding: 3px 20px 20px 20px;
    @media (max-width: 500px) {
      width: 100%;
    }
    display: flex;
    margin: 0;
    button {
      flex-basis: 0;
      flex-grow: 1;
      max-width: 100%;
      height: 42px;
    }
  }
  .modal-body {
    padding-bottom: 0;
  }
}
</style>
