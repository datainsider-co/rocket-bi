<template>
  <div>
    <form>
      <InputEmail :id="genInputId('email')" @onEmailChanged="handleEmailChanged" />
      <InputPass :id="genInputId('password')" @onPasswordChanged="handlePasswordChanged" class="password" />
      <hr />
      <div class="auth-form-btn-login regular-text">
        <div class="d-flex justify-content-between">
          <div :class="getHiddenClass" :id="genBtnId('google-login')" class="auth-form-gmail-login" @click="handleLoginWithGoogle">
            <a class="text-decoration-none text-white " href="#">
              <img class="mr-2" id="ic_google" src="@/assets/icon/ic_google.svg" />
              <span>
                Log in with Gmail
              </span>
            </a>
          </div>
          <button :id="genBtnId('login')" :style="{ cursor: getCursorStyle }" class="btn btn-primary login-btn" @click.prevent="handleLogin" type="submit">
            Log in
          </button>
        </div>
      </div>
    </form>
    <span class="span-login" v-if="getErrorMessage">{{ getErrorMessage }}</span>
  </div>
</template>
<script lang="ts">
import InputEmail from '@/screens/login/components/input-components/InputEmail.vue';
import InputPass from '@/screens/login/components/input-components/InputPass.vue';
import { Component, Vue } from 'vue-property-decorator';
import { AuthenticationModule, AuthenticationStatus } from '@/store/modules/AuthenticationStore';
import { LoginConstants, OauthType, Routers } from '@/shared';
import { Log } from '@core/utils';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { RouterLeavingHook } from '@/shared/components/vue-hook/RouterLeavingHook';
import { RouterUtils } from '@/utils/RouterUtils';

@Component({
  components: {
    InputEmail,
    InputPass
  }
})
export default class SignIn extends Vue {
  email = '';
  password = '';
  isErrorEmail = true;
  isErrorPassword = true;
  errorMessage = '';

  get getCursorStyle(): string {
    return AuthenticationModule.authStatus == AuthenticationStatus.Authenticating ? 'wait' : '';
  }

  get getErrorMessage(): string {
    return this.errorMessage;
  }

  get getHiddenClass(): string {
    if (AuthenticationModule.isActiveLoginGoogle) {
      return '';
    }
    return 'hidden';
  }

  handleEmailChanged(email: string, error: boolean) {
    this.email = email;
    this.isErrorEmail = error;
    this.errorMessage = '';
  }

  handlePasswordChanged(password: string, error: boolean) {
    this.password = password;
    this.isErrorPassword = error;
    this.errorMessage = '';
  }

  @AtomicAction()
  async handleLogin() {
    const isError = this.isErrorPassword || this.isErrorEmail;
    if (isError) {
      this.errorMessage = LoginConstants.MESSAGE_ERRORS;
      Log.debug('login failure cause', this.errorMessage);
    } else {
      try {
        await AuthenticationModule.login({
          email: this.email,
          password: this.password,
          remember: true
        });
        Di.get(DataManager).setLoginType(OauthType.DEFAULT);
        this.handleNextPage(this.$route);
      } catch {
        this.errorMessage = AuthenticationModule.errorMessage;
      }
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
          Di.get(DataManager).setLoginType(OauthType.GOOGLE);
          this.handleNextPage(this.$route);
        }
      }
    } catch (e) {
      Log.error('SignIn::setupGoogleOAuthConfig::error::', e.message);
      this.errorMessage = AuthenticationModule.errorMessage || e.message;
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

<style lang="scss" scoped>
.hidden {
  display: none;
}

.login-btn {
  letter-spacing: 0.1px;
  margin-left: auto;
  margin-right: auto;
}

.f-password {
  text-align: left;
  margin-left: 32px;
  margin-bottom: 18px;
}

a {
  text-decoration: underline;
}

a:hover {
  color: var(--accent);
  opacity: 0.5;
}

.btn-ghost {
  color: var(--accent);
}

.auth-form-btn-login {
  margin-top: 8px;
}

.auth-form-btn-login > div {
  //padding: 0 16px 24px 16px;
  padding: 12px 12px 20px 12px;
}

.auth-form-gmail-login {
  transform: translateY(11px);
}

.auth-form-btn-login button {
  width: 142px;
  height: 42px;
  margin-top: 2px !important;
  padding: 0px !important;
}

.span-login {
  color: var(--danger);
  position: absolute;
  bottom: -30px;
  transform: translateX(-50%);
}

@media screen and (max-width: 1440px) {
  .span-login {
    bottom: -44px;
  }
}

@media screen and (max-width: 1024px) {
  .span-login {
    bottom: -25px;
  }
}

@media screen and (max-width: 768px) {
  .span-login {
    bottom: -30px;
  }
}

@media screen and (max-width: 425px) {
  .f-password {
    margin-left: 26px;
    margin-bottom: 15px;
  }

  .auth-form-btn-login > div {
    padding: 0 9px 16px 9px;
  }

  .span-login {
    bottom: -40px;
  }

  .auth-form-btn-login button {
    width: 137px;
    height: 39px;
  }
}

@media screen and (max-width: 375px) {
  .f-password {
    margin-left: 27px;
    margin-bottom: 15px;
  }

  .auth-form-btn-login > div {
    padding: 0 8px 14px 8px;
    width: auto;
  }

  .span-login {
    bottom: -42px;
  }

  .auth-form-btn-login button {
    width: 134px;
    height: 38px;
  }
}

@media screen and (max-width: 320px) {
  .f-password {
    margin-left: 25px;
    margin-bottom: 14px;
  }

  .auth-form-btn-login > div {
    padding: 0 5px 10px 5px;
    width: auto;
  }

  .span-login {
    bottom: -45px;
  }

  .auth-form-btn-login button {
    width: 128px;
    height: 36px;
  }
}

@media screen and (max-height: 200px) {
  .deco1 {
    display: none;
  }
}
</style>
