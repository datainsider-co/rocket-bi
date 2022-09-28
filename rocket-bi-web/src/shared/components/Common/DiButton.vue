<template>
  <div :id="id" :style="btnStyle" tabindex="-1" class="di-button" @click="handleClick">
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

@Component
export default class DiButton extends Vue {
  @Prop({ default: '', type: String })
  private readonly title?: string;

  @Prop({ default: '', type: String })
  private readonly placeholder!: string;

  @Prop({ default: '', type: String })
  private readonly textStyle?: string;

  @Prop({ default: false, type: Boolean })
  private readonly isDisable!: boolean;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: Boolean })
  private readonly isLoading!: boolean;

  get fullStyle(): string {
    return !this.textStyle ? 'regular-text-14 flex-shrink-1 ' : 'flex-shrink-1 ' + this.textStyle;
  }

  private get btnStyle(): CSSStyleDeclaration {
    if (this.isDisable) {
      return {
        opacity: 0.5,
        pointerEvents: 'none'
      } as any;
    } else {
      return {} as any;
    }
  }

  @Emit('click')
  private handleClick(event: MouseEvent): MouseEvent {
    return event;
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
    line-height: 1;
    padding-bottom: 0;
    padding-top: 0;
    text-align: center;
    white-space: nowrap;
    //width: 100%;
    padding-left: 6px;
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
}
</style>
