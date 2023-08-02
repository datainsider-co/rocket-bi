<template>
  <div class="flex-column justify-content-between ">
    <div>
      <label class="regular-text">
        {{ getMessageResendEmail }}
      </label>
      <InputEmail :id="generateId('input', 'email')" @onEmailChanged="handleEmailChanged" />
      <hr />
    </div>
    <div class="btn-resend-email ">
      <button @click.prevent="handleResendEmail()" class="btn btn-primary" type="submit">
        {{ getBtnResendEmail }}
      </button>
    </div>
    <span class="span-error">{{ this.emailError }}</span>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { LoginConstants } from '@/shared/constants/LoginConstants';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import InputEmail from '@/screens/login/components/input-components/InputEmail.vue';
import { Routers } from '@/shared/enums/Routers';
import { Log } from '@core/utils';

@Component({
  components: {
    InputEmail
  }
})
export default class ResendEmail extends Vue {
  btnResendEmail = LoginConstants.BUTTON_RESEND_EMAIL;
  msResendEmail = LoginConstants.MESSAGE_EMAIL_RESEND;
  email = '';
  isErrorEmail = true;
  emailError = '';

  get getBtnResendEmail(): string {
    Log.debug(this.btnResendEmail);
    return this.btnResendEmail;
  }

  get getMessageResendEmail(): string {
    return this.msResendEmail;
  }

  async handleResendEmail() {
    if (this.isErrorEmail) {
      this.emailError = LoginConstants.MESSAGE_ERRORS;
    } else {
      const directLogin = await AuthenticationModule.resendEmail({ email: this.email });
      if (directLogin) {
        await this.$router.replace({ name: Routers.Login });
      }
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

.btn-resend-email {
  display: flex;
  justify-content: flex-end;
}

.span-error {
  color: var(--danger);
}
</style>
