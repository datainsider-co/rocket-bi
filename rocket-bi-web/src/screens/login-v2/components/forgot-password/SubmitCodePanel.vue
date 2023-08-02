<template>
  <div class="form-panel">
    <div class="oath-form-container">
      <h3>Enter the verification code (OTP)</h3>
      <h5 class="mb-5">Code sent to email: {{ email }}</h5>
      <div class="submit-code-container">
        <form class="submit-code-form">
          <input
            v-for="(_, index) in totalPinCode"
            :key="index"
            :autofocus="index === 0"
            ref="codeInputs"
            maxlength="1"
            @paste="event => handlePasteCode(event)"
            @keydown="event => handleKeyUp(index, event)"
            @input="event => handleInput(index)"
            @click="handleSelect(index)"
            @keyup.enter="onCodeChanged"
          />
        </form>
        <div>
          <div class="unselectable" v-if="timeLeft > 0">
            Resend code after <span href="#" style="color: var(--accent-2)">{{ timeLeft }} seconds</span>
          </div>
          <span v-else><a href="#" @click="resendCode(email)">Resend code?</a></span>
          <div class="mt-3">Wrong email? <a href="#" @click="changeEmail">Edit email</a></div>
        </div>
        <DiButton title="Confirm" primary-2 :disabled="isLoading || code.length === 0" :isLoading="isLoading" @click="onCodeChanged" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref, Watch } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { get, isNumber } from 'lodash';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { PopupUtils } from '@/utils';

@Component({})
export default class SubmitCodePanel extends Vue {
  @Prop({ default: '', type: String, required: false })
  private readonly email!: string;
  private readonly timeoutResend = window.appConfig.TIMEOUT_SHOW_RESEND_SECOND;

  private isLoading = false;

  private code = '';
  private readonly totalPinCode = window.appConfig.TOTAL_PIN_CODE;
  private timeLeft = this.timeoutResend; //second
  private resendTimer: number | undefined = void 0;

  @Ref()
  private readonly codeInputs!: HTMLInputElement[];

  mounted() {
    this.initCounter();
    this.focusFirst();
  }

  private initCounter() {
    if (this.resendTimer === undefined) {
      this.resendTimer = setInterval(() => {
        if (this.timeLeft <= 0) {
          clearInterval(this.resendTimer);
          this.resendTimer = void 0;
        }
        this.timeLeft -= 1;
      }, 1000);
    }
  }

  beforeDestroy() {
    this.resendTimer = void 0;
  }

  focusFirst() {
    this.codeInputs[0].focus();
  }

  handlePasteCode(event: ClipboardEvent) {
    Log.debug('handlePasteCode::event', event);
    const code = event.clipboardData?.getData('text') ?? '';
    Log.debug('handlePasteCode', code.length === this.totalPinCode, isNumber(parseInt(code)));
    ///Valid Code
    if (code.length === this.totalPinCode && isNumber(parseInt(code))) {
      this.code = code;
      this.codeInputs.forEach((input, index) => {
        input.value = code[index];
      });
      this.codeInputs[this.totalPinCode - 1].focus();
    }
  }

  private isBackspaceKey(key: string) {
    return key === 'Backspace';
  }

  private isEnterKey(key: string) {
    return key === 'Enter';
  }

  private isArrowRightKey(key: string) {
    return key === 'ArrowRight';
  }

  private isArrowLeftKey(key: string) {
    return key === 'ArrowLeft';
  }

  handleInput(index: number) {
    if (index === this.codeInputs.length - 1) {
      // Last one => Return final code
      this.code = [...this.codeInputs].map(input => input.value).join('');
    }
    if (this.codeInputs[index].value) {
      this.codeInputs[index + 1]?.focus();
    }
  }

  handleSelect(index: number) {
    this.codeInputs[index]?.focus();
    this.codeInputs[index]?.setSelectionRange(0, 1);
  }

  handleKeyUp(index: number, event: KeyboardEvent) {
    Log.debug('handleKeyUp', event, 'index::', index);
    if (this.isBackspaceKey(event.key)) {
      //Delete
      this.handleBackSpace(index);
    }
    if (this.isEnterKey(event.key)) {
      this.onCodeChanged();
    }
    if (this.isArrowLeftKey(event.key)) {
      this.codeInputs[index - 1]?.focus();
    }
    if (this.isArrowRightKey(event.key)) {
      this.codeInputs[index + 1]?.focus();
    }
  }

  private handleBackSpace(inputIndex: number) {
    if (this.codeInputs[inputIndex].value) {
      this.codeInputs[inputIndex].value = '';
      return;
    }
    if (!this.codeInputs[inputIndex].value && inputIndex > 0) {
      this.codeInputs[inputIndex - 1].focus();
      return;
    }
  }

  @Watch('code')
  async onCodeChanged() {
    Log.debug('onCodeChanged', this.code);
    if (this.code.length === this.totalPinCode) {
      try {
        this.isLoading = true;
        await AuthenticationModule.validCode({ email: this.email, code: this.code });
        this.$emit('success', this.email, this.code);
      } catch (ex) {
        Log.error(ex);
        PopupUtils.showError(ex.message);
      } finally {
        this.isLoading = false;
      }
    }
  }

  private resendCode(email: string) {
    this.code = '';
    AuthenticationModule.forgotPassword({ email: email });
    this.timeLeft = this.timeoutResend;
    this.initCounter();
  }

  private changeEmail() {
    this.$emit('back');
  }
}
</script>

<style lang="scss">
.submit-code-form {
  display: flex;
  justify-content: space-between;

  input {
    padding: 0.5rem;
    width: 50px;
    height: 50px;
    text-align: center;

    font-style: normal;
    font-weight: 500;
    font-size: 36px;
    line-height: 132%;
    border: 2px none transparent;
    border-radius: 3px;
    border-bottom: solid var(--icon-hover-color, #d6d6d6);

    &:hover,
    &:focus,
    &:active {
      border-bottom: solid var(--accent-2);
    }
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }
}

.submit-code-container {
  margin-top: 90px;
  display: grid;
  grid-template-column: auto;
  gap: 32px;

  .di-button {
    height: 46px;
  }
}
</style>
