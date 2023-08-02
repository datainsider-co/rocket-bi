<template>
  <div class="form-panel">
    <div class="oath-form-container">
      <h3>Forgot password</h3>
      <h5 class="text-left">No worries, please type an email you used to login. We will send a verify code for you to reset your password.</h5>
      <div class="forgot-password-form">
        <DiInputComponent2
          id="input-email"
          autofocus
          v-model="email"
          label="Email"
          placeholder="demo@datainsider.co"
          type="email"
          :error="emailErrorMessage"
          @enter="sendCode(email)"
        />
      </div>
      <div id="login-actions">
        <DiButton title="Send Code" primary-2 :isLoading="isLoading" :disabled="isLoading" id="basic-login-btn" @click="sendCode(email)" />
        <DiIconTextButton id="back-login-btn" title="Back to Login" border :isLoading="isLoading" :disabled="isLoading" @click="back">
          <i class="di-icon-arrow-left2" style="font-size:24px"></i>
        </DiIconTextButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import { email, required } from 'vuelidate/lib/validators';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { AtomicAction } from '@/shared/anotation';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { PopupUtils } from '@/utils';

@Component({
  components: { DiIconTextButton, DiInputComponent2 },
  validations: {
    email: { required, email }
  }
})
export default class ForgotPasswordPanel extends Vue {
  private email = '';

  private isLoading = false;

  private get emailErrorMessage(): string {
    if (!this.$v.email.$error) {
      return '';
    }
    if (!this.$v.email.required) {
      return 'Email is required!';
    }
    return 'Invalid email format';
  }

  valid() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private back() {
    this.$emit('back');
  }

  @AtomicAction()
  private async sendCode(email: string) {
    try {
      this.isLoading = true;
      if (this.valid()) {
        await AuthenticationModule.forgotPassword({ email: email });
        this.isLoading = false;
        this.$emit('success', email);
      }
    } catch (e) {
      PopupUtils.showError(e.message);
      // this.errorMessage = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}
</script>
<style lang="scss">
.forgot-password-form {
  margin: 36px 0;
}
</style>
