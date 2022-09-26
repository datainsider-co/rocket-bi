<template>
  <div class="login-screen">
    <div class="login-screen-left-panel">
      <div class="login-screen-left-panel-body">
        <div class="login-screen-left-panel-body-form">
          <div class="login-screen-left-panel-body-form-logo">
            <img alt="DataInsider-logo" src="@/assets/logo/text-logo.png" />
          </div>
          <div class="login-screen-left-panel-body-form-header">
            <div class="login-screen-left-panel-body-form-header-title">Login</div>
            <div class="d-none login-screen-left-panel-body-form-header-subtitle">
              You can use test account (test@datainsider.co/di@2020) to login.
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
              @enter="handleLogin"
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
              @enter="handleLogin"
            ></DiInputComponent>
          </div>
          <div class="login-screen-left-panel-body-form-action">
            <DiButton
              v-if="isActiveGoogleLogin"
              :disabled="isLoginLoading"
              border
              class="login-screen-left-panel-body-form-action-google-login"
              title="Login with Gmail"
              @click="handleLoginWithGoogle"
            >
              <img class="mr-2" id="ic_google" src="@/assets/icon/ic_google.svg" />
            </DiButton>
            <DiButton :isLoading="isLoginLoading" class="login-screen-left-panel-body-form-action-login" primary title="Login" @click="handleLogin" />
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
import { Component, Vue } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { AuthenticationModule } from '@/store/modules/authentication.store';
import { AtomicAction } from '@/shared/anotation';
import { Log } from '@core/utils';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import { LoginConstants, OauthType, Routers } from '@/shared';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { RouterUtils } from '@/utils/RouterUtils';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { StringUtils } from '@/utils/string.utils';
import { required, email } from 'vuelidate/lib/validators';

@Component({
  components: {
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
  errorMessage = '';

  private isLoginLoading = false;

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

  @AtomicAction()
  async handleLogin() {
    try {
      this.isLoginLoading = true;
      if (this.isValidFormLogin()) {
        await AuthenticationModule.login({
          email: this.email,
          password: this.password,
          remember: true
        });
        DI.get(DataManager).setLoginType(OauthType.DEFAULT);
        this.handleNextPage(this.$route);
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
          DI.get(DataManager).setLoginType(OauthType.GOOGLE);
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

  private isValidFormLogin(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private handleResetEmail() {
    this.email = '';
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

          img {
            width: 118.8px;
            height: 40px;
          }
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
            height: 42px;
          }
          &-google-login {
            width: 146px;
            height: 42px;
            justify-content: center;
            margin-right: 8px;

            .title {
              width: fit-content;
              padding-left: 0;
              color: var(--accent);
              font-size: 14px;
            }
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
