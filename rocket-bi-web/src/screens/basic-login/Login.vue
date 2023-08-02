<template>
  <div class="login-screen">
    <div class="login-screen-left-panel">
      <div class="login-screen-left-panel-body">
        <LoginForm
          v-if="isLoginMode"
          ref="loginForm"
          :error-message="errorMessage"
          :is-login-loading="isLoginLoading"
          @login="handleLogin"
          @loginWithGoogle="handleLoginWithGoogle"
          @forgotPassword="selectMode(FormLoginMode.ForgotPassword)"
        />
        <ForgotPasswordForm
          v-else-if="isForgotPasswordForm"
          ref="forgotPasswordForm"
          :error-message="errorMessage"
          :isLoading="isForgotPasswordLoading"
          @back="selectMode(FormLoginMode.Login)"
          @forgotPassword="handleForgotPassword"
        />
        <ResetPasswordForm
          v-else
          ref="resetPasswordForm"
          :is-loading="isResetPasswordLoading"
          :isResendLoading="isForgotPasswordLoading"
          :error-message="errorMessage"
          @resetPassword="handleResetPassword"
          @resendCode="handleResendVerificationCode(forgotPasswordEmail)"
          @back="selectMode(FormLoginMode.ForgotPassword)"
        />
      </div>
      <div class="deco1">
        <img id="deco1" alt="deco1" src="@/assets/icon/ic_deco_1.svg" />
      </div>
      <div class="deco2">
        <img alt="deco2" src="@/assets/icon/ic_deco_2.svg" />
      </div>
    </div>

    <div class="login-screen-right-panel col-md-8 w-100 p-0 d-none d-xl-block">
      <div>
        <div class="deco3">
          <img alt="deco3" src="@/assets/icon/ic_deco_3.svg" />
        </div>
        <div class="deco-ill">
          <img alt="deco illustration" src="@/assets/icon/ic_illustration.svg" />
        </div>
        <div class="deco4">
          <img alt="deco4" src="@/assets/icon/ic_deco_4.svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { AtomicAction } from '@/shared/anotation';
import { Log } from '@core/utils';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { LoginConstants, OauthType, Routers } from '@/shared';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { RouterUtils } from '@/utils/RouterUtils';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';
import ForgotPasswordForm from '@/screens/login/components/forgot-password/ForgotPasswordForm.vue';
import LoginForm from '@/screens/basic-login/components/LoginForm.vue';
import ResetPasswordForm from '@/screens/login/components/forgot-password/ResetPasswordForm.vue';
import { UserResetPasswordRequest } from '@core/common/domain/request/authentication/UserResetPasswordRequest';
import Swal from 'sweetalert2';
import { Modals } from '@/utils';
import { Inject } from 'typescript-ioc';
import { ClickhouseConfigService, StageStatus } from '@core/clickhouse-config';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { PlanAndBillingModule } from '@/screens/organization-settings/stores/PlanAndBillingStore';

export enum FormLoginMode {
  Login = 'login',
  ForgotPassword = 'forgot_password',
  SubmitCode = 'submit_code',
  ResetPassword = 'reset_password'
}

@Component({
  components: {
    ForgotPasswordForm,
    LoginForm,
    ResetPasswordForm,
    CompanyLogoNameComponent,
    DiInputComponent
  }
})
export default class Login extends Vue {
  $alert!: typeof Swal;

  private FormLoginMode = FormLoginMode;
  private mode = FormLoginMode.Login;
  errorMessage = '';
  forgotPasswordEmail = '';

  private isLoginLoading = false;
  private isForgotPasswordLoading = false;
  private isResetPasswordLoading = false;

  @Inject
  clickhouseService!: ClickhouseConfigService;

  @Ref()
  private readonly loginForm?: LoginForm;

  @Ref()
  private readonly forgotPasswordForm?: ForgotPasswordForm;

  @Ref()
  private readonly resetPasswordForm?: ResetPasswordForm;

  private get isLoginMode() {
    return this.mode === FormLoginMode.Login;
  }

  private get isForgotPasswordForm() {
    return this.mode === FormLoginMode.ForgotPassword;
  }

  private get isResetPasswordForm() {
    return this.mode === FormLoginMode.ResetPassword;
  }

  private resetErrorMessage() {
    this.errorMessage = '';
  }

  mounted() {
    AuthenticationModule.loadLoginMethods();
  }

  @AtomicAction()
  async handleLogin(email: string, password: string) {
    try {
      this.isLoginLoading = true;
      if (this.isValidFormLogin()) {
        this.resetErrorMessage();
        await AuthenticationModule.login({
          email: email,
          password: password,
          remember: true
        });
        DataManager.setLoginType(OauthType.DEFAULT);
        this.handleNextPage(this.$route);
        await this.handleInitDataSourceConfig();
        await PlanAndBillingModule.init();
      }
      this.isLoginLoading = false;
    } catch (ex) {
      if (ex.statusCode === 400) {
        this.errorMessage = AuthenticationModule.errorMessage;
      } else {
        this.errorMessage = LoginConstants.MESSAGE_ERRORS;
      }
    } finally {
      this.isLoginLoading = false;
    }
  }

  private async handleInitDataSourceConfig() {
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
      if (AuthenticationModule.googleOauthConfig?.isActive) {
        const response: gapi.auth2.AuthorizeResponse = await GoogleUtils.loginGoogle(AuthenticationModule.googleClientId, 'profile email');
        Log.debug('login with google', response);
        if (response.error) {
          this.errorMessage = 'Login with google failure';
          Log.error('login with google error cause', (response as any).details ?? response.error);
        } else {
          const profile = await GoogleUtils.getUserProfile(response.access_token);
          Log.debug('profile::', profile);
          await AuthenticationModule.loginOAuth({ oauthType: OauthType.GOOGLE, id: profile.result.id, token: response.id_token });
          DataManager.setLoginType(OauthType.GOOGLE);
          this.handleNextPage(this.$route);
        }
      }
    } catch (e) {
      Log.error('SignIn::setupGoogleOAuthConfig::error::', e.message);
      this.errorMessage = AuthenticationModule.errorMessage || e.message;
    }
  }

  @AtomicAction()
  private async handleForgotPassword(email: string) {
    try {
      this.isForgotPasswordLoading = true;
      if (this.isValidForgotPasswordForm()) {
        this.resetErrorMessage();
        await AuthenticationModule.forgotPassword({ email: email });
        this.forgotPasswordEmail = email;
        this.selectMode(FormLoginMode.ResetPassword);
        this.isForgotPasswordLoading = false;
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.isForgotPasswordLoading = false;
    }
  }

  @AtomicAction()
  private async handleResendVerificationCode(email: string) {
    try {
      this.isForgotPasswordLoading = true;
      this.resetErrorMessage();
      await AuthenticationModule.forgotPassword({ email: email });
      this.selectMode(FormLoginMode.ResetPassword);
      this.isForgotPasswordLoading = false;
      Swal.fire({
        icon: 'success',
        title: 'Email Sent Successfully!',
        html: `Please check verify code in your email and type your new password.`,
        showCancelButton: false
      });
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.isForgotPasswordLoading = false;
    }
  }

  @AtomicAction()
  private async handleResetPassword(request: UserResetPasswordRequest) {
    try {
      request.setEmail(this.forgotPasswordEmail);
      Log.debug('Login::handleResetPassword::', request);
      this.isResetPasswordLoading = true;
      if (this.isValidResetPasswordForm()) {
        await AuthenticationModule.resetPassword({ request: request });
        this.selectMode(FormLoginMode.Login);
        this.isResetPasswordLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          html: 'Your new password is updated.',
          showCancelButton: false
        });
      }
    } catch (e) {
      this.errorMessage = e.message;
    } finally {
      this.isResetPasswordLoading = false;
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

  private isValidFormLogin(): boolean {
    return this.loginForm?.isValidFormLogin() ?? false;
  }

  private isValidForgotPasswordForm(): boolean {
    return this.forgotPasswordForm?.isValidForgotPasswordForm() ?? false;
  }

  private isValidResetPasswordForm(): boolean {
    return this.resetPasswordForm?.isValidResetPasswordForm() ?? false;
  }

  private selectMode(mode: FormLoginMode) {
    this.resetErrorMessage();
    this.mode = mode;
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

#app {
  height: 100%;
}

.login-screen {
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;

  &-left-panel {
    background-color: var(--primary);
    height: 100%;
    display: flex;
    position: relative;
    width: 100%;
    z-index: 0;

    .deco1 {
      position: absolute;
      left: 33%;
      bottom: 12px;
    }

    .deco2 {
      position: absolute;
      top: 16px;
      right: 0;
    }

    &-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &-form {
        background: var(--secondary);
        //height: 349px;
        width: 332px;
        border-radius: 4px;
        position: relative;

        &-logo {
          width: 332px;
          text-align: left;
          position: absolute;
          left: 0;
          top: -56px;

          color: var(--text-color);
        }

        &-error {
          margin-top: 4px;
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;

          word-break: break-word;
        }

        &-header {
          padding: 16px 16px 12px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;

          &-title {
            @include regular-text(0.77px, var(--text-color));
            font-size: 18px;
            margin-bottom: 8px;
            height: 21px;

            display: flex;
            align-items: center;
            //box-sizing: border-box;
          }

          &-subtitle {
            @include regular-text(0.2px, var(--text-color));
            line-height: 1.43;
            opacity: 0.8;
          }
        }

        &-body {
          padding: 16px;
          opacity: 0.8;
          text-align: left;

          .di-input-component--label {
            font-size: 12px;
            line-height: 14px;
          }

          &-email {
            margin-bottom: 16px;
            i {
              font-size: 16px !important;
              margin-right: 12px;
            }
          }

          &-password {
            i {
              font-size: 12px !important;
            }
          }
        }

        &-action {
          padding: 8px 16px 24px;
          display: flex;
          align-items: center;
          justify-content: center;

          &-login {
            width: 146px;
            height: 40px;
          }
        }

        .login-screen-left-panel-body-form-action--google-active {
          padding: 8px 16px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          column-gap: 8px;

          .login-screen-left-panel-body-form-action-login {
            flex: 1;
            width: unset;
            height: 40px;
          }

          .login-screen-left-panel-body-form-action-google-login {
            flex: 1;
            display: flex;
            height: 40px;
          }
        }
      }
    }
  }

  &-right-panel {
    background-color: var(--accent);
    height: 100%;
    position: relative;
    width: 100%;

    .deco3 {
      position: absolute;
      right: 0;
    }

    .deco-ill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      margin-left: 20.8%;
      display: flex;
      align-items: center;
      img {
        position: absolute;
        width: 67.6%;
        height: 68.9%;
      }
    }

    .deco4 {
      bottom: 0;
      left: 20%;
      position: absolute;
      right: 20%;
    }
  }
}
</style>
