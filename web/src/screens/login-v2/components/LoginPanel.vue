<template>
  <div class="form-panel">
    <div class="oath-form-container">
      <h2 class="unselectable">Welcome to RocketBI</h2>
      <h4 class="unselectable">Login</h4>
      <div id="login-form">
        <DiInputComponent2
          id="input-email"
          autofocus
          v-model="email"
          label="Email"
          placeholder="email@datainsider.co"
          type="email"
          :error="emailErrorMessage"
        />
        <DiInputComponent2
          id="input-password"
          v-model="password"
          isPassword
          label="Password"
          placeholder="Your password"
          type="password"
          :error="passwordErrorMessage"
          @enter="login(email, password)"
        />
        <div class="d-flex mt-2">
          <a class="ml-auto" @click="forgotPassword">Forgot password</a>
        </div>
      </div>
      <div id="login-actions">
        <DiButton
          title="Login"
          primary-2
          :disabled="isLoginLoading || isGoogleLoginLoading"
          :isLoading="isLoginLoading"
          id="basic-login-btn"
          @click="login(email, password)"
        />
        <DiIconTextButton
          v-if="isActiveGoogleLogin"
          id="btn-google-login"
          title="Sign in with Google"
          border
          :isLoading="isGoogleLoginLoading"
          :disabled="isLoginLoading || isGoogleLoginLoading"
          @click="handleLoginWithGoogle"
        >
          <i v-if="isGoogleLoginLoading" class="fa fa-spin fa-spinner"></i>
          <img v-else src="@/assets/icon/ic_google.svg" alt="" />
        </DiIconTextButton>
        <!--        <a v-if="isActiveGoogleLogin" id="btn-google-login" @click="handleLoginWithGoogle">-->
        <!--          <img v-if="isLoginLoading" alt="login-with-google" src="@/assets/icon/login/login-with-google-disabled.png" />-->
        <!--          <img v-else alt="login-with-google" src="@/assets/icon/login/login-with-google.png" />-->
        <!--        </a>-->
      </div>
      <span>Don't have an account yet? <a href="#" @click.prevent="switchToRegister">Register</a></span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import { PopupUtils, RouterUtils, StringUtils } from '@/utils';
import { Log } from '@core/utils';
import { email, required } from 'vuelidate/lib/validators';
import { AtomicAction } from '@core/common/misc';
import { DataManager } from '@core/common/services';
import { LoginConstants, OauthType, Routers } from '@/shared';
import { PlanAndBillingModule } from '@/screens/organization-settings/stores/PlanAndBillingStore';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { DIException } from '@core/common/domain';
import { Route } from 'vue-router';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';

@Component({
  components: { DiIconTextButton, DiInputComponent2 },
  validations: {
    email: { required, email },
    password: { required }
  }
})
export default class LoginPanel extends Vue {
  private isLoginLoading = false;
  private isGoogleLoginLoading = false;

  email = '';
  password = '';

  private get isEmailEmpty() {
    return StringUtils.isEmpty(this.email);
  }

  private get isActiveGoogleLogin() {
    return AuthenticationModule.googleOauthConfig?.isActive ?? false;
  }

  // @ts-ignored
  private readonly config = require('@/shared/constants/config.json');

  private get usernameExample(): string {
    return this.config.login.account.username ?? '';
  }

  private get passwordExample(): string {
    return this.config.login.account.password ?? '';
  }

  private get isShowAccountExample(): boolean {
    return this.config.login.isShowHint ?? false;
  }

  public valid(): boolean {
    this.$v.$touch();
    return !this.$v.$invalid;
  }

  private get emailErrorMessage(): string {
    if (!this.$v.email.$error) {
      return '';
    }
    if (!this.$v.email.required) {
      return 'Email is required!';
    }
    return 'Invalid email format';
  }

  private get passwordErrorMessage(): string {
    if (!this.$v.password.$error) {
      return '';
    }
    if (!this.$v.password.required) {
      return 'Password is required!';
    }

    return '';
  }

  private handleResetEmail() {
    this.email = '';
  }

  private loginWithGoogle() {
    this.$emit('loginWithGoogle');
  }

  private forgotPassword() {
    this.$emit('forgotPassword');
  }

  private switchToRegister() {
    Log.debug('LoginForm::switchToRegister::url::', window.appConfig.REGISTER_URL);
    window.open(window.appConfig.REGISTER_URL, '_self');
  }

  @AtomicAction()
  async login(email: string, password: string) {
    try {
      AuthenticationModule.setErrorMessage('');
      this.isLoginLoading = true;
      if (this.valid()) {
        await AuthenticationModule.login({
          email: email,
          password: password,
          remember: true
        });
        DataManager.setLoginType(OauthType.DEFAULT);
        this.handleNextPage(this.$route);
        await PlanAndBillingModule.init();
        await this.handleInitClickhouseConfig();
      }
      this.isLoginLoading = false;
    } catch (ex) {
      const message = ex.statusCode === 400 ? AuthenticationModule.errorMessage : LoginConstants.MESSAGE_ERRORS;
      PopupUtils.showError(message);
    } finally {
      this.isLoginLoading = false;
    }
  }

  private async handleInitClickhouseConfig() {
    try {
      await ConnectionModule.init();
      if (ConnectionModule.isNavigateToConnectionConfig) {
        await RouterUtils.to(Routers.ClickhouseConfig);
      }
    } catch (e) {
      Log.error('Login::handleCheckClickhouseConfig::error::', e);
    }
  }

  @AtomicAction()
  private async handleLoginWithGoogle() {
    try {
      this.isGoogleLoginLoading = true;
      AuthenticationModule.setErrorMessage('');
      if (AuthenticationModule.googleOauthConfig?.isActive) {
        const response: gapi.auth2.AuthorizeResponse = await GoogleUtils.loginGoogle(AuthenticationModule.googleClientId, 'profile email');
        Log.debug('login with google', response);
        if (response.error) {
          Log.error('login with google error cause', (response as any).details ?? response.error);
          throw new DIException('Login with google failure');
        } else {
          const profile = await GoogleUtils.getUserProfile(response.access_token);
          Log.debug('profile::', profile);
          await AuthenticationModule.loginOAuth({
            oauthType: OauthType.GOOGLE,
            id: profile.result.id,
            token: response.id_token
          });
          DataManager.setLoginType(OauthType.GOOGLE);
          this.handleNextPage(this.$route);
          await PlanAndBillingModule.init();
          await this.handleInitClickhouseConfig();
        }
      }
    } catch (e) {
      PopupUtils.showError(AuthenticationModule.errorMessage || e.message);
      Log.error('SignIn::setupGoogleOAuthConfig::error::', e.message);
    } finally {
      this.isGoogleLoginLoading = false;
    }
  }

  private handleNextPage(currentRoute: Route) {
    const previousScreenName: Routers = currentRoute.query['previous_screen'] as Routers;
    Log.debug('handleNextPage::', previousScreenName);
    if (previousScreenName) {
      RouterUtils.to(previousScreenName, {
        query: currentRoute.query,
        replace: true
      });
    } else {
      RouterUtils.to(Routers.AllData, { replace: true });
    }
  }
}
</script>
