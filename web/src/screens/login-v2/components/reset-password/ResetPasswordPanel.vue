<template>
  <div class="form-panel">
    <div class="oath-form-container reset-form-container">
      <h3>Create a new password</h3>
      <h5>Enter and confirm your new password again.</h5>
      <div class="reset-password-form">
        <DiInputComponent2 id="email-input" v-model="email" label="Email" placeholder="Input email..." type="email" disabled />
        <DiInputComponent2
          autofocus
          is-password
          v-model="password"
          label="New Password"
          placeholder="Input new password..."
          type="password"
          autocomplete="new-password"
          :error="passwordErrorMessage"
          requireIcon
        />
        <DiInputComponent2
          v-model="rePassword"
          is-password
          label="Confirm Password"
          placeholder="Input confirm password..."
          type="password"
          autocomplete="new-password"
          :error="rePasswordErrorMessage"
          @enter="handleResetPassword(email, code, password, rePassword)"
          requireIcon
        />
      </div>
      <DiButton title="Completed" primary-2 :disabled="isLoading" :isLoading="isLoading" @click="handleResetPassword(email, code, password, rePassword)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import { minLength, required, sameAs } from 'vuelidate/lib/validators';
import { AtomicAction } from '@core/common/misc';
import { UserResetPasswordRequest } from '@core/common/domain/request/authentication/UserResetPasswordRequest';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { PopupUtils } from '@/utils';

@Component({
  components: { DiInputComponent2 },
  validations: {
    password: { required, minLength: minLength(6) },
    rePassword: { required, sameAsPassword: sameAs('password') }
  }
})
export default class ResetPasswordPanel extends Vue {
  @Prop({ default: '', type: String, required: false })
  private readonly email!: string;

  @Prop({ default: '', type: String, required: false })
  private readonly code!: string;

  private password = '';
  private rePassword = '';
  private isLoading = false;

  private get passwordErrorMessage(): string {
    if (!this.$v.password.$error) {
      return '';
    }
    if (!this.$v.password.required) {
      return 'Password is required!';
    }

    if (!this.$v.password.minLength) {
      return 'Password must be at least 6 characters!';
    }
    return '';
  }

  private get rePasswordErrorMessage(): string {
    if (!this.$v.rePassword.$error) {
      return '';
    }
    if (!this.$v.rePassword.required) {
      return 'Confirm Password is required!';
    }

    if (!this.$v.rePassword.sameAsPassword) {
      return 'Confirm Password not correct!';
    }
    return '';
  }

  valid() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  @AtomicAction()
  private async handleResetPassword(email: string, code: string, password: string, rePassword: string) {
    try {
      const request = new UserResetPasswordRequest(email, password, rePassword, code);
      this.isLoading = true;
      if (this.valid()) {
        await AuthenticationModule.resetPassword({ request: request });
        this.isLoading = false;
        PopupUtils.showSuccess('Your new password is updated.');
        this.$emit('success');
      }
    } catch (e) {
      PopupUtils.showError(e.message);
    } finally {
      this.isLoading = false;
    }
  }
}
</script>

<style lang="scss">
.reset-form-container {
  .reset-password-form {
    display: grid;
    grid-template-column: auto;
    gap: 8px;
    margin: 36px 0;

    #email-input {
      opacity: 1;
      label {
        opacity: 1;
      }
      .di-input-area {
        opacity: var(--disable-opacity);
      }
    }
  }

  .di-button {
    height: 46px;
  }
}
</style>
