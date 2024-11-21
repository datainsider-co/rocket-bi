<template>
  <div>
    <form>
      <InputEmail :id="genInputId('email')" @onEmailChanged="handleEmailChanged" />
      <InputPass :id="genInputId('password')" @onPasswordChanged="handlePasswordChanged" class="password" />
      <div class="f-password">
        <router-link :class="getHiddenClassOnBasicLogin" class="btn-ghost" tag="a" to="/forgot-password">
          Forgot your password?
        </router-link>
      </div>
      <hr />
      <div class="auth-form-btn-login regular-text">
        <div class="d-flex justify-content-between">
          <div class="auth-form-gmail-login" ref="signinBtn" type="submit">
            <a class="text-decoration-none text-white " href="#">
              <img class="mr-2" id="ic_google" src="@/assets/icon/ic_google.svg" />
              <span>
                Log in with Gmail
              </span>
            </a>
          </div>
          <button :style="{ cursor: getCursorStyle }" class="btn btn-primary login-btn" @click.prevent="handleLogin" type="submit">
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
import { Component, Inject, Vue } from 'vue-property-decorator';
import { AuthenticationModule, AuthenticationStatus } from '@/store/modules/AuthenticationStore';
import { LoginConstants, OauthType } from '@/shared';
import { Log } from '@core/utils';

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
  clientId = window.appConfig.VUE_APP_GOOGLE_CLIENT_ID;

  get getCursorStyle(): string {
    return AuthenticationModule.authStatus == AuthenticationStatus.Authenticating ? 'wait' : '';
  }

  get getErrorMessage(): string {
    return this.errorMessage;
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

  async handleLogin() {
    const isError = this.isErrorPassword || this.isErrorEmail;
    if (isError) {
      this.errorMessage = LoginConstants.MESSAGE_ERRORS;
      Log.debug(this.errorMessage, 'at handleLogin Signin.vue');
    } else {
      await AuthenticationModule.login({
        email: this.email,
        password: this.password,
        remember: true
      });
      if (AuthenticationModule.errorMessage) {
        this.errorMessage = AuthenticationModule.errorMessage;
      }
    }
  }

  //onSignIn with Gmail api
  mounted() {
    this.setupGoogleLogin();
  }

  private setupGoogleLogin() {
    if (!window.gapi) {
      throw new Error('"https://apis.google.com/js/api:client.js" needs to be included as a <script>.');
    }

    if (!this.clientId) {
      throw new Error('Client Id must be specified.');
    }

    window.gapi.load('auth2', () => {
      // eslint-disable-next-line @typescript-eslint/camelcase
      const auth2 = window.gapi.auth2.init({ client_id: this.clientId });
      if (auth2.isSignedIn.get()) {
        auth2.signOut();
        auth2.disconnect();
      }
      auth2.attachClickHandler(
        this.$refs.signinBtn,
        {},
        googleUser => {
          const oauthType = OauthType.GOOGLE;
          const id = googleUser.getId();
          const token = googleUser.getAuthResponse().id_token;
          AuthenticationModule.loginOAuth({ oauthType, id, token });
        },
        error => {
          //
          //
        }
      );
    });
  }
}
</script>

<style lang="scss" scoped>
.login-btn {
  letter-spacing: 0.1px;
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
  padding: 0 16px 24px 16px;
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
