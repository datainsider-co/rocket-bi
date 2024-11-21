<template>
  <div class="oath-page">
    <LoginPanel v-if="mode === FormLoginMode.Login" @forgotPassword="selectMode(FormLoginMode.ForgotPassword)" />
    <ForgotPasswordPanel v-if="mode === FormLoginMode.ForgotPassword" @back="selectMode(FormLoginMode.Login)" @success="handleForgotPassword" />
    <SubmitCodePanel
      v-if="mode === FormLoginMode.SubmitCode"
      :email="forgotPasswordEmail"
      @back="selectMode(FormLoginMode.ForgotPassword)"
      @success="handleSubmitCode"
    />
    <ResetPasswordPanel v-if="mode === FormLoginMode.ResetPassword" :email="forgotPasswordEmail" :code="pinCode" @success="selectMode(FormLoginMode.Login)" />
    <LoginDecoPanel id="decor-panel" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { AtomicAction } from '@core/common/misc';
import { FormLoginMode } from '@/screens/basic-login/Login.vue';
import LoginDecoPanel from '@/screens/login-v2/components/login/LoginDecoPanel.vue';
import LoginPanel from '@/screens/login-v2/components/LoginPanel.vue';
import ForgotPasswordPanel from '@/screens/login-v2/components/forgot-password/ForgotPasswordPanel.vue';
import ResetPasswordPanel from '@/screens/login-v2/components/reset-password/ResetPasswordPanel.vue';
import SubmitCodePanel from '@/screens/login-v2/components/forgot-password/SubmitCodePanel.vue';

@Component({
  components: {
    SubmitCodePanel,
    ForgotPasswordPanel,
    LoginDecoPanel,
    LoginPanel,
    ResetPasswordPanel
  }
})
export default class Login extends Vue {
  private FormLoginMode = FormLoginMode;
  private mode = FormLoginMode.Login;
  forgotPasswordEmail = '';
  pinCode = '';

  mounted() {
    AuthenticationModule.loadLoginMethods();
  }

  @AtomicAction()
  private async handleForgotPassword(email: string) {
    this.forgotPasswordEmail = email;
    this.selectMode(FormLoginMode.SubmitCode);
  }

  @AtomicAction()
  private async handleSubmitCode(email: string, code: string) {
    this.forgotPasswordEmail = email;
    this.pinCode = code;
    this.selectMode(FormLoginMode.ResetPassword);
  }

  private selectMode(mode: FormLoginMode) {
    this.mode = mode;
  }
}
</script>

<style lang="scss" src="./login-v2.scss" />
