<template>
  <div class="di-input-component">
    <div class="di-input-component--label" v-if="label">
      <div class="di-input-component--label-left" v-if="label">{{ label }}</div>
      <slot name="subtitle">
        <div class="di-input-component--label-right" @click="$emit('clickSubtitle')">{{ subtitle }}</div>
      </slot>
    </div>
    <div class="di-input-component--input">
      <b-form-input
        ref="input"
        :name="autocomplete"
        :autocomplete="autocomplete"
        @keydown.enter="emitEnterEvent"
        @input="input => $emit('input', input)"
        @change="value => $emit('change', value)"
        v-bind="$attrs"
        :type="currentType"
      ></b-form-input>
      <slot name="suffix">
        <div v-if="isPassword">
          <i v-if="isShowPassword" class="btn-icon-border fas fa-eye" @click="toggleShowPassword"></i>
          <i v-else class="btn-icon-border fas fa-eye-slash" @click="toggleShowPassword"></i>
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

@Component({
  inheritAttrs: true
})
export default class DiInputComponent extends Vue {
  private isShowPassword = false;

  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: false, type: String })
  private readonly subtitle!: string;

  @Prop({ required: false, type: String })
  private readonly type!: string;

  @Prop({ required: false, type: String, default: 'off' })
  private readonly autocomplete!: string;

  private get currentType(): string {
    return this.isShowPassword ? 'text' : this.type;
  }

  private get isPassword(): boolean {
    return this.type === 'password';
  }

  private toggleShowPassword() {
    this.isShowPassword = !this.isShowPassword;
  }

  focus() {
    //@ts-ignored
    this.$refs.input.focus();
  }

  @Emit('enter')
  private async emitEnterEvent(event: Event) {
    // trick, wait for input value changed
    await TimeoutUtils.sleep(50);
    return event;
  }
}
</script>

<style lang="scss">
.di-input-component {
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
      padding: 12px;
      background: unset !important;

      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 18px;

      &::placeholder {
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;

        color: #677883;
      }
    }

    > div {
      margin-right: 12px;
      height: 24px;
      width: 24px;

      i {
        font-size: 16px;
      }
    }
  }

  > * + * {
    margin-top: 8px;
  }
}
</style>
