<template>
  <div class="login-form">
    <div class="login-screen-left-panel-body-form">
      <CompanyLogoNameComponent class="login-screen-left-panel-body-form-logo"></CompanyLogoNameComponent>
      <div class="login-screen-left-panel-body-form-header">
        <div class="login-screen-left-panel-body-form-header-title">Login</div>
        <div v-if="isShowHint" class="login-screen-left-panel-body-form-header-subtitle">
          {{ hintMessage }}
        </div>
      </div>
      <div class="login-screen-left-panel-body-form-body">
        <DiInputComponent
          class="login-screen-left-panel-body-form-body-email"
          autofocus
          autocomplete="off"
          :id="genInputId('email')"
          label="EMAIL"
          v-model="email"
          placeholder="Your email"
          @enter="login(email, password)"
        >
          <template v-if="!isEmailEmpty" #suffix>
            <div>
              <i class="di-icon-close btn-icon-border" @click="handleResetEmail"></i>
            </div>
          </template>
        </DiInputComponent>
        <DiInputComponent
          class="login-screen-left-panel-body-form-body-password"
          :id="genInputId('password')"
          placeholder="Your password"
          autocomplete="off"
          label="PASSWORD"
          v-model="password"
          type="password"
          @enter="login(email, password)"
        ></DiInputComponent>
        <a class="d-flex justify-content-end btn-link mt-1" @click="forgotPassword">Forgot password</a>
      </div>
      <div
        :class="{
          'login-screen-left-panel-body-form-action': !isActiveGoogleLogin,
          'login-screen-left-panel-body-form-action--google-active': isActiveGoogleLogin
        }"
      >
        <a v-if="isActiveGoogleLogin" id="google-login-btn" class="login-screen-left-panel-body-form-action-google-login" @click="loginWithGoogle">
          <img v-if="isLoginLoading" alt="login-with-google" src="@/assets/icon/login/login-with-google-disabled.png" />
          <img v-else alt="login-with-google" src="@/assets/icon/login/login-with-google.png" />
        </a>
        <DiButton
          id="basic-login-btn"
          :disabled="isLoginLoading"
          :isLoading="isLoginLoading"
          class="login-screen-left-panel-body-form-action-login"
          primary
          title="Login"
          @click="login(email, password)"
        />
      </div>
      <div v-if="!isLoginLoading" class="login-screen-left-panel-body-form-error display-error">
        <template v-if="$v.email.$error">
          <div v-if="!$v.email.required">Email is required</div>
          <div v-else>Invalid email format</div>
        </template>
        <template v-else-if="$v.password.$error">
          <div v-if="!$v.password.required">Email is required</div>
        </template>
        <div v-else>{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { StringUtils } from '@/utils/StringUtils';
import { email, required } from 'vuelidate/lib/validators';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';
import ForgotPassword from '@/screens/login/components/forgot-password/ForgotPasswordForm.vue';

@Component({
  components: {
    ForgotPassword,
    CompanyLogoNameComponent,
    DiInputComponent
  },
  validations: {
    email: { required, email },
    password: { required }
  }
})
export default class Login extends Vue {
  email = '';
  password = '';
  @Prop({ required: false, default: '' })
  private readonly errorMessage?: string;

  @Prop({ required: false, default: false })
  private readonly isLoginLoading?: boolean;

  private get isEmailEmpty() {
    return StringUtils.isEmpty(this.email);
  }

  private get isActiveGoogleLogin() {
    return AuthenticationModule.googleOauthConfig?.isActive ?? false;
  }

  private get isShowHint(): boolean {
    return window.appConfig.VUE_APP_LOGIN_SAMPLE.isShowHint;
  }
  private get hintMessage(): string {
    return window.appConfig.VUE_APP_LOGIN_SAMPLE.hintMessage ?? '';
  }

  public isValidFormLogin(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private handleResetEmail() {
    this.email = '';
  }

  private login(email: string, password: string) {
    this.$emit('login', email, password);
  }

  private loginWithGoogle() {
    this.$emit('loginWithGoogle');
  }

  private forgotPassword() {
    this.$emit('forgotPassword');
  }
}
</script>
