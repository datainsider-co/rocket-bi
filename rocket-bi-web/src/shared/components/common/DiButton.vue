<template>
  <div :id="id" :style="btnStyle" :class="justifyContentClass" tabindex="-1" class="di-button" @click="handleClick">
    <template v-if="isLoading">
      <i class="fa fa-spin fa-spinner"></i>
    </template>
    <slot></slot>
    <div :class="fullStyle" class="title unselectable">{{ title || placeholder }}</div>
    <slot name="suffix-content"></slot>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { AtomicAction } from '@core/common/misc';

@Component
export default class DiButton extends Vue {
  @Prop({ default: '', type: String })
  protected readonly title?: string;

  @Prop({ default: '', type: String })
  protected readonly placeholder!: string;

  @Prop({ default: '', type: String })
  protected readonly textStyle?: string;

  @Prop({ default: false, type: Boolean })
  protected readonly isDisable!: boolean;

  @Prop({ required: false, type: String })
  protected readonly id!: string;

  @Prop({ required: false, type: Boolean })
  protected readonly isLoading!: boolean;

  /**
   * align text in button (left, center, right)
   */
  @Prop({ required: false, type: String, default: 'center' })
  protected readonly align!: string;

  protected get justifyContentClass(): string {
    switch (this.align) {
      case 'left':
        return 'justify-content-start';
      case 'right':
        return 'justify-content-end';
      default:
        return 'justify-content-center';
    }
  }

  get fullStyle(): string {
    return !this.textStyle ? 'regular-text-14 flex-shrink-1 ' : 'flex-shrink-1 ' + this.textStyle;
  }

  protected get btnStyle(): CSSStyleDeclaration {
    if (this.isDisable) {
      return {
        opacity: 0.5,
        pointerEvents: 'none'
      } as any;
    } else {
      return {} as any;
    }
  }

  @AtomicAction()
  protected handleClick(event: MouseEvent): void {
    this.$emit('click', event);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/_button.scss';

.di-button {
  cursor: pointer;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  .regular-text-14 {
    line-height: 1.4; // cause issue with text-overflow: ellipsis
    padding-bottom: 0;
    padding-top: 0;
    text-align: center;
    white-space: nowrap;
    padding-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;

    &:first-child {
      padding-left: 0;
    }
  }

  > .fa-spinner + .regular-text-14 {
    margin-left: 4px;
  }

  @extend .btn-ghost;

  &[primary] {
    @extend .btn-primary;
  }

  &[primary-2] {
    @extend .btn-primary;
    background-color: var(--accent-2) !important;
    &:hover,
    &:active,
    &:focus {
      background-color: var(--accent--root) !important;
    }
  }

  &[hover-primary] {
    &:hover,
    &:active,
    &:focus {
      background-color: var(--accent--root) !important;
      color: white !important;
    }
  }

  &[white] {
    cursor: pointer !important;
    border-radius: 4px;
    border: none;
    @include medium-text(14px, 0.18);

    &,
    &:active,
    &:focus {
      color: var(--text-color) !important;
      background-color: var(--secondary-2) !important;
    }

    &:hover {
      color: var(--text-color) !important;
      background-color: var(--secondary-2) !important;
    }

    &:disabled,
    &[disabled] {
      background: var(--accent-disabled-color, #bebebe) !important;
      color: var(--accent-text-color, white) !important;
      cursor: not-allowed !important;
      pointer-events: none !important;
    }
  }

  &[border] {
    border: solid #d6d6d6 1px !important;
  }

  &[border-accent] {
    border: solid var(--accent) 1px !important;
    color: var(--accent) !important;
  }

  &[text-accent] {
    color: var(--accent) !important;
  }
}
</style>
