<template>
  <div>
    <form>
      <InputEmail :id="genInputId('email')" @onEmailChanged="handleEmailChanged" />
      <InputPass :id="genInputId('password')" @onPasswordChanged="handlePasswordChanged" class="password" />
      <hr />
      <div class="auth-form-btnSignup regular-text">
        <div class="d-flex flex-row-reverse justify-content-between">
          <button :style="{ cursor: getCursorStyle }" @click.prevent="handleSignUp" class="btn btn-primary" type="submit">
            Sign up
          </button>
        </div>
      </div>
    </form>
    <span v-if="notifyMessage" class="span-notify">{{ getNotify }}</span>
    <span v-else-if="errorMessage" class="span-error">{{ getErrorMessage }}</span>
  </div>
</template>
<script lang="ts">
import InputEmail from '@/screens/login/components/input-components/InputEmail.vue';
import InputPass from '@/screens/login/components/input-components/InputPass.vue';

import { Component, Vue } from 'vue-property-decorator';
import { AuthenticationModule, AuthenticationStatus } from '@/store/modules/AuthenticationStore';
import { LoginConstants } from '@/shared';

@Component({
  components: {
    InputEmail,
    InputPass
  }
})
export default class SignUp extends Vue {
  email = '';
  password = '';
  isErrorEmail = true;
  isErrorPassword = false;
  errorMessage = '';
  notifyMessage = '';

  get getErrorMessage(): string {
    return this.errorMessage;
  }

  get getNotify(): string {
    return this.notifyMessage;
  }

  get getCursorStyle(): string {
    return AuthenticationModule.authStatus == AuthenticationStatus.Authenticating ? 'wait' : '';
  }

  handleEmailChanged(email: string, error: boolean) {
    this.email = email;
    this.isErrorEmail = error;
    this.errorMessage = '';
    this.notifyMessage = '';
  }

  handlePasswordChanged(password: string, error: boolean) {
    this.password = password;
    this.isErrorPassword = error;
    this.errorMessage = '';
    this.notifyMessage = '';
  }

  async handleSignUp() {
    const isError = this.isErrorPassword || this.isErrorEmail;
    if (isError) {
      this.errorMessage = LoginConstants.MESSAGE_ERRORS;
    } else {
      await AuthenticationModule.register({ email: this.email, password: this.password });
      if (AuthenticationModule.notifyMessage) {
        this.notifyMessage = AuthenticationModule.notifyMessage;
        this.errorMessage = '';
      } else {
        this.errorMessage = AuthenticationModule.errorMessage;
        this.notifyMessage = '';
      }
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';

.auth-form-btnSignup button {
  width: 142px;
  height: 42px;
  margin-top: 2px;
  padding: 0px !important;
}

.auth-form-btnSignup > div {
  padding: 14px 16px 24px 16px;
}

.span-error {
  color: var(--danger);
  position: absolute;
  bottom: -8%;
  transform: translateX(-50%);
}

.span-notify {
  color: $accentColor;
  position: absolute;
  bottom: -8%;
  transform: translateX(-50%);
}
</style>
