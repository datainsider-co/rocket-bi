<template>
  <div class="password-recovery-form">
    <div class="login-screen-left-panel-body-form">
      <CompanyLogoNameComponent class="login-screen-left-panel-body-form-logo"></CompanyLogoNameComponent>
      <div class="login-screen-left-panel-body-form-header">
        <div class="login-screen-left-panel-body-form-header-title">
          <i class="di-icon-arrow-left btn-icon btn-icon-border p-1 mr-1" @click="back"></i>
          <span>Reset Password</span>
        </div>
      </div>
      <div class="login-screen-left-panel-body-form-body">
        <DiInputComponent
          type="password"
          label="NEW PASSWORD"
          autofocus
          autocomplete="new-password"
          :id="genInputId('new-password')"
          v-model="resetPasswordRequest.newPassword"
          placeholder="New password"
          @enter="resetPassword(resetPasswordRequest)"
        >
          <template v-if="$v.resetPasswordRequest.$error" #error>
            <div class="error">
              <template v-if="!$v.resetPasswordRequest.newPassword.required">New password is required.</template>
              <template v-else-if="!$v.resetPasswordRequest.newPassword.minLength">New password is at least 6 characters long</template>
            </div>
          </template>
        </DiInputComponent>
        <DiInputComponent
          type="password"
          label="CONFIRM PASSWORD"
          autocomplete="new-password"
          :id="genInputId('confirm-new-password')"
          v-model="resetPasswordRequest.confirmPassword"
          placeholder="Confirm password"
          @enter="resetPassword(resetPasswordRequest)"
        >
          <template #error v-if="$v.resetPasswordRequest.confirmPassword.$error">
            <div class="error">
              Confirm password does not match.
            </div>
          </template>
        </DiInputComponent>
        <DiInputComponent
          label="VERIFICATION CODE"
          autocomplete="off"
          :id="genInputId('verification-code')"
          v-model="resetPasswordRequest.verifyCode"
          placeholder="Verification code"
          @enter="resetPassword(resetPasswordRequest)"
        >
          <template v-if="!isVerifyCodeEmpty" #suffix-icon>
            <div>
              <i class="di-icon-close btn-icon-border" @click="setVerifyCode('')"></i>
            </div>
          </template>
          <template #error v-if="$v.resetPasswordRequest.verifyCode.$error">
            <div class="error">
              Verification code is required.
            </div>
          </template>
        </DiInputComponent>
      </div>
      <div class="login-screen-left-panel-body-form-action">
        <DiButton
          id="resend"
          :isLoading="isResendLoading"
          :disabled="isResendLoading"
          secondary
          class="login-screen-left-panel-body-form-action-google-login"
          title="Resend Code"
          @click="resendCode"
        />

        <DiButton
          id="basic-reset-btn"
          :isLoading="isLoading"
          :disabled="isLoading"
          class="login-screen-left-panel-body-form-action-login w-50"
          primary
          title="Reset Password"
          @click="resetPassword(resetPasswordRequest)"
        />
      </div>
      <div v-if="errorMessage" class="login-screen-left-panel-body-form-error display-error">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import InputEmail from '../input-components/InputEmail.vue';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UserResetPasswordRequest } from '@core/common/domain/request/authentication/UserResetPasswordRequest';
import { StringUtils } from '@/utils';
import { minLength, required, sameAs } from 'vuelidate/lib/validators';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';
import { Log } from '@core/utils';

@Component({
  components: {
    InputEmail,
    CompanyLogoNameComponent
  },
  validations: {
    resetPasswordRequest: {
      verifyCode: { required },
      newPassword: {
        required,
        minLength: minLength(6)
      },
      confirmPassword: { required, sameAsPassword: sameAs('newPassword') }
    }
  }
})
export default class ResetPasswordForm extends Vue {
  private resetPasswordRequest: UserResetPasswordRequest = UserResetPasswordRequest.default();

  @Prop({ required: false, default: false })
  private isLoading!: boolean;

  @Prop({ required: false, default: false })
  private isResendLoading!: boolean;

  @Prop({ required: false, default: '' })
  private readonly errorMessage?: string;

  public isValidResetPasswordForm(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private setVerifyCode(code: string) {
    this.resetPasswordRequest.setVerifyCode(code);
  }

  private get isVerifyCodeEmpty() {
    return StringUtils.isEmpty(this.resetPasswordRequest.verifyCode);
  }

  private back() {
    this.$emit('back');
  }

  private resetPassword(request: UserResetPasswordRequest) {
    this.$emit('resetPassword', request);
  }

  private resendCode() {
    this.$emit('resendCode');
  }
}
</script>

<style lang="scss">
.password-recovery-form {
  .login-screen-left-panel-body-form-header {
    padding-left: 4px;
  }
  .di-input-component {
    &:not(:last-child) {
      margin-bottom: 16px;
    }
  }
}
</style>
