<template>
  <div class="flex-column justify-content-between ">
    <div>
      <label class="regular-text">
        {{ messageForgotPassword }}
      </label>
      <InputEmail :id="generateId('input', 'email')" @onEmailChanged="handleEmailChanged" />
      <hr />
    </div>
    <div class="btn-reset-password ">
      <button @click.prevent="handleResetPassword()" class="btn btn-primary" type="submit">
        {{ nameBtnResetPassword }}
      </button>
    </div>
    <span class="span-login">{{ this.emailError }}</span>
  </div>
</template>

<script lang="ts">
import InputEmail from '../InputComponents/InputEmail.vue';
import { Component, Vue } from 'vue-property-decorator';
import { LoginConstants } from '@/shared/constants/login.constants';
import { AuthenticationModule } from '@/store/modules/authentication.store';
import { Routers } from '@/shared';

@Component({
  components: {
    InputEmail
  }
})
export default class ForgotPassword extends Vue {
  messageForgotPassword = LoginConstants.MESSAGE_FORGOT_PASSWORD;
  nameBtnResetPassword = LoginConstants.BUTTON_RESET_PASSWORD;
  email = '';
  isErrorEmail = true;
  emailError = '';

  async handleResetPassword() {
    if (this.isErrorEmail) {
      this.emailError = LoginConstants.MESSAGE_NOTIFY_FORGOT_PASSWORD;
    } else {
      await AuthenticationModule.resetPassword({ email: this.email });
      this.emailError = AuthenticationModule.errorMessage;
      alert('Check new password in your registered email');
      await this.$router.push({ name: Routers.Login });
    }
  }

  handleEmailChanged(email: string, error: boolean) {
    this.email = email;
    this.isErrorEmail = error;
    this.emailError = '';
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';

.regular-text {
  letter-spacing: 0.2px !important;
  opacity: 0.5;
  font-size: 14px;
  text-align: left;
  margin: 16px 16px 0;
}

button {
  width: 142px;
  height: 42px;
  border-radius: 4px;
  margin: 16px 16px 24px;
  box-sizing: border-box;
  border: solid 1px var(--primary);
}

.btn-reset-password {
  display: flex;
  justify-content: flex-end;
}

.span-login {
  color: var(--danger);
  position: absolute;
  bottom: -9%;
  right: 15%;
  left: 15%;
}
</style>
