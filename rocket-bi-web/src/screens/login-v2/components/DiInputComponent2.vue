<template>
  <div class="di-input-container" :class="{ 'input-disabled': disabled, 'input-error': hasError, 'input-password': isPassword }">
    <label v-if="label" class="text-truncate">{{ label }} <span v-if="requireIcon">*</span></label>
    <div class="di-input-area">
      <b-form-input
        class="text-truncate"
        :id="id"
        v-bind="$attrs"
        :style="`padding-right: ${suffixWidth}px`"
        :type="localType"
        @keydown.enter="emitEnterEvent"
        @input="input => $emit('input', input)"
        @change="value => $emit('change', value)"
        @onfocusout="$emit('onfocusout')"
        :disabled="disabled"
      />
      <div v-if="isPassword" class="btn-eye">
        <i v-if="isShowPassword" class="fas fa-eye" @click="toggleEye"></i>
        <i v-else class="fas fa-eye-slash" @click="toggleEye"></i>
      </div>
      <div class="suffix-text" ref="suffixEle">{{ suffixText }}</div>
    </div>
    <label class="error-msg text-truncate" v-if="hasError">{{ error }}</label>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Emit, Prop, Ref, Watch } from 'vue-property-decorator';
import { StringUtils, TimeoutUtils } from '@/utils';
import { BFormInput } from 'bootstrap-vue';

@Component({
  inheritAttrs: true
})
export default class DiInputComponent2 extends Vue {
  @Prop({ required: false, type: String })
  private readonly id?: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly label!: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly error!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disabled!: boolean;
  @Prop({ required: false, type: Boolean, default: false })
  private readonly isPassword!: boolean;

  @Prop({ required: false, type: String, default: 'text' })
  private readonly type!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly requireIcon!: boolean;

  @Prop({ required: false, type: String, default: '' })
  private readonly suffixText!: string;

  private localType = this.type;
  private suffixWidth = 0;
  //
  @Ref()
  private readonly suffixEle?: HTMLDivElement;

  @Watch('type')
  onTypeChanged() {
    this.localType = this.type;
  }

  mounted() {
    this.suffixWidth = this.getSuffixWidth();
  }

  private getSuffixWidth(): number {
    const padding = 12;
    if (this.suffixEle) {
      const subPadding = 4;
      return this.suffixEle.clientWidth + padding + subPadding;
    }
    return padding;
  }

  @Emit('enter')
  private async emitEnterEvent(event: Event) {
    // trick, wait for input value changed
    await TimeoutUtils.sleep(50);
    return event;
  }

  private get hasError(): boolean {
    return StringUtils.isNotEmpty(this.error);
  }

  private get isShowPassword(): boolean {
    return this.localType === 'password';
  }

  private toggleEye() {
    const newType = this.isShowPassword ? 'text' : 'password';
    this.localType = newType;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/_button.scss';

.di-input-container {
  --blue: #0066ff;
  --blue-light: #0066ff;
  --ink-grey: #919eab;
  --ink: #212b36;

  display: flex;
  flex-direction: column;
  align-items: start;

  label {
    margin-bottom: 0.25rem;

    span {
      color: var(--error);
    }
  }

  .di-input-area {
    position: relative;
    width: 100%;

    input {
      height: 40px;
      background-color: transparent;
      padding: 10px 12px;
      box-shadow: 0 0 0 1px #d6d6d6;
      border-radius: 4px;
      caret-color: var(--blue);
      color: var(--ink);

      ::placeholder {
        /* Chrome, Firefox, Opera, Safari 10.1+ */
        color: var(--ink-grey);
        font-size: 14px;
        line-height: 20px;
        opacity: 1; /* Firefox */
      }

      :-ms-input-placeholder {
        /* Internet Explorer 10-11 */
        font-size: 14px;
        line-height: 20px;
        color: var(--ink-grey);
      }

      ::-ms-input-placeholder {
        /* Microsoft Edge */
        font-size: 14px;
        line-height: 20px;
        color: var(--ink-grey);
      }

      &:focus,
      &:active {
        background-color: transparent;

        box-shadow: 0 0 0 2px var(--blue);

        &:hover {
          box-shadow: 0 0 0 2px var(--blue);
        }
      }

      &:hover {
        background-color: transparent;
        box-shadow: 0 0 0 1px var(--blue-light);
      }
    }
  }

  .btn-eye {
    width: 24px;
    height: 24px;
    position: absolute;
    right: 12px;
    top: 8px;

    i {
      font-size: 16px;
      @extend .btn-icon-border;
    }
  }

  .suffix-text {
    position: absolute;
    right: 12px;
    top: 10px;
    color: var(--ink-grey);
  }

  .error-msg {
    color: var(--error);
    margin-top: 4px;
    margin-bottom: 0;
  }

  &.input-error {
    input {
      box-shadow: 0 0 0 1px var(--error);
      &:focus,
      &:active {
        box-shadow: 0 0 0 2px var(--error);

        &:hover {
          box-shadow: 0 0 0 2px var(--error);
        }
      }

      &:hover {
        box-shadow: 0 0 0 1px var(--error);
      }
    }
  }

  &.input-disabled {
    opacity: var(--disable-opacity);

    > * {
      cursor: not-allowed;
    }

    input {
      cursor: not-allowed;

      &:hover {
        box-shadow: 0 0 0 1px #d6d6d6;
      }
    }
  }

  &.input-password {
    input {
      padding-right: 40px;
    }
  }
}
</style>
