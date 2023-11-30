<template>
  <div class="di-input-component" :border="border" :class="{ 'di-input-component--error': isError, 'di-input-component--disabled': disabled }">
    <div class="di-input-component--label" v-if="label">
      <div class="di-input-component--label-left" v-if="label">{{ label }}</div>
      <slot name="subtitle">
        <div class="di-input-component--label-right" @click="$emit('clickSubtitle')">{{ subtitle }}</div>
      </slot>
    </div>
    <div class="di-input-component--input" @click="handleClickInput">
      <b-form-input
        ref="input"
        :name="autocomplete"
        :autocomplete="autocomplete"
        @keydown.enter="emitEnterEvent"
        @input="input => $emit('input', input)"
        @change="value => $emit('change', value)"
        @onfocusout="$emit('onfocusout')"
        :readonly="readonly"
        v-bind="$attrs"
        :type="currentType"
        :disabled="disabled"
      ></b-form-input>
      <slot name="suffix">
        <div class="di-input-component--input--icon" v-if="$slots['suffix-icon'] || isPassword">
          <slot name="suffix-icon">
            <div v-if="isPassword">
              <i v-if="isShowPassword" class="fas fa-eye" @click="toggleShowPassword"></i>
              <i v-else class="fas fa-eye-slash" @click="toggleShowPassword"></i>
            </div>
          </slot>
        </div>
      </slot>
    </div>
    <slot name="error"></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Emit, Prop } from 'vue-property-decorator';
import { TimeoutUtils } from '@/utils';
import { AtomicAction } from '@core/common/misc';

@Component({
  inheritAttrs: true
})
export default class DiInputComponent extends Vue {
  protected isShowPassword = false;

  @Prop({ required: false, type: String })
  protected readonly label!: string;

  @Prop({ required: false, type: String })
  protected readonly subtitle!: string;

  @Prop({ required: false, type: String })
  protected readonly type!: string;

  @Prop({ required: false, type: String, default: 'off' })
  protected readonly autocomplete!: string;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly disabled!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly readonly!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly border!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isError!: boolean;

  protected get currentType(): string {
    return this.isShowPassword ? 'text' : this.type;
  }

  protected get isPassword(): boolean {
    return this.type === 'password';
  }

  protected toggleShowPassword() {
    this.isShowPassword = !this.isShowPassword;
  }

  focus() {
    //@ts-ignored
    this.$refs.input.focus();
  }

  selectAll() {
    //@ts-ignored
    this.$refs.input.select();
  }

  @AtomicAction()
  async emitEnterEvent(event: Event): Promise<void> {
    // trick, wait for input value changed
    await TimeoutUtils.sleep(50);
    this.$emit('enter', event);
  }

  protected handleClickInput() {
    if (!this.disabled) {
      this.focus();
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/_button.scss';

.di-input-component {
  cursor: text;

  &--label {
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    cursor: default;
    display: flex;
    justify-content: space-between;

    &-right {
      color: var(--accent);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &--input {
    height: 42px;
    display: flex;
    align-items: center;
    background: #f2f2f7;
    border-radius: 4px;

    .form-control {
      padding: 0 12px;
      background: unset !important;

      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.4;
      height: unset;

      &::placeholder,
      :-ms-input-placeholder,
      ::-ms-input-placeholder {
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 1.4;

        color: #677883;
      }
    }

    &--icon {
      width: 24px;
      height: 24px;
      margin-right: 7px;

      i {
        font-size: 16px;
        @extend .btn-icon-border;
      }
    }
  }

  > .di-input-component--label + .di-input-component--input {
    margin-top: 8px;
  }

  &[border] {
    .di-input-component--input {
      background: transparent;
      box-shadow: 0 0 0 1px #d6d6d6;
      // avoid box-shadow overlap
      margin-bottom: 1px;
      margin-left: 1px;
      margin-right: 1px;
      caret-color: var(--blue);
      color: var(--ink);
      height: 40px;
      transition: background-color 0.3s ease-in-out;

      input {
        height: inherit;
      }

      &:focus-within,
      &:active,
      &:hover {
        box-shadow: 0 0 0 1px var(--accent);
      }
    }

    &.di-input-component--error {
      .di-input-component--input {
        box-shadow: 0 0 0 1px var(--danger);
      }
    }

    &.di-input-component--disabled {
      opacity: 1;

      .di-input-component--input {
        box-shadow: 0 0 0 1px #c4cdd5;
        background: #f4f6f8;
        height: 40px;

        input {
          color: #919eab;
          cursor: not-allowed;

          &::placeholder,
          :-ms-input-placeholder,
          ::-ms-input-placeholder {
            color: #919eab;
          }
        }
      }
    }
  }
}

.di-input-component--disabled {
  opacity: var(--disable-opacity);

  > * {
    cursor: not-allowed;
  }
}
</style>
