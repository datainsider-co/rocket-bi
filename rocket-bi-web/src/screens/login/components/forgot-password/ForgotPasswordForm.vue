<template>
  <div class="forgot-password-form">
    <div class="login-screen-left-panel-body-form">
      <CompanyLogoNameComponent class="login-screen-left-panel-body-form-logo"></CompanyLogoNameComponent>
      <div class="login-screen-left-panel-body-form-header">
        <div class="login-screen-left-panel-body-form-header-title">
          <i class="di-icon-arrow-left btn-icon btn-icon-border p-1 mr-1" @click="back"></i>
          <span>Forgot Password</span>
        </div>
      </div>
      <div class="login-screen-left-panel-body-form-body">
        <div>{{ messageForgotPassword }}</div>
        <DiInputComponent class="mt-2" autofocus autocomplete="off" :id="genInputId('email')" v-model="email" placeholder="Email" @enter="handleForgotPassword">
          <template v-if="!isEmailEmpty" #suffix>
            <div>
              <i class="di-icon-close btn-icon-border" @click="handleResetEmail"></i>
            </div>
          </template>
          <template #error v-if="$v.email.$error">
            <div class="error">
              <template v-if="!$v.email.required">Email is required</template>
              <template v-else>Invalid email format</template>
            </div>
          </template>
        </DiInputComponent>
      </div>
      <div class="login-screen-left-panel-body-form-action">
        <DiButton
          id="basic-reset-btn"
          :isLoading="isLoading"
          :disabled="isLoading"
          class="login-screen-left-panel-body-form-action-login"
          primary
          title="Send Code"
          @click="handleForgotPassword"
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
import { Component, Vue, Prop } from 'vue-property-decorator';
import { LoginConstants } from '@/shared/constants/LoginConstants';
import { StringUtils } from '@/utils';
import { email, required } from 'vuelidate/lib/validators';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';

@Component({
  components: {
    InputEmail,
    CompanyLogoNameComponent
  },
  validations: {
    email: { required, email }
  }
})
export default class ForgotPasswordForm extends Vue {
  messageForgotPassword = LoginConstants.MESSAGE_FORGOT_PASSWORD;
  email = '';

  @Prop({ required: false, default: false })
  private readonly isLoading?: boolean;

  @Prop({ required: false, default: '' })
  private readonly errorMessage?: string;

  public isValidForgotPasswordForm(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private get isEmailEmpty() {
    return StringUtils.isEmpty(this.email);
  }

  private handleResetEmail() {
    this.email = '';
  }

  handleForgotPassword() {
    this.$emit('forgotPassword', this.email);
  }

  private back() {
    this.$emit('back');
  }
}
</script>

<style lang="scss">
.forgot-password-form {
  .login-screen-left-panel-body-form-header {
    padding-left: 4px;
  }
}
</style>
