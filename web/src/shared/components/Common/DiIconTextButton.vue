<template>
  <div :id="id" tabindex="-1" class="di-btn-icon-text btn-icon-text" :style="btnStyle" @click="emitClick">
    <slot></slot>
    <span class="title unselectable d-none d-sm-inline">{{ title }}</span>
    <slot name="suffix-content"></slot>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DiIconTextButton extends Vue {
  @Prop({ default: '', type: String })
  private readonly title!: string;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Prop({ default: false, type: Boolean })
  private readonly isDisable!: boolean;

  @Emit('click')
  private emitClick(event: MouseEvent) {
    return event;
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
}
</script>

<style lang="scss">
div.di-btn-icon-text {
  padding: 6px;
  height: 28px;
  display: flex;
  flex-direction: row;
  justify-items: center;
  align-items: center;
  color: var(--secondary-text-color);
  cursor: pointer;

  > i {
    opacity: 0.8;
  }

  > span {
    margin-left: 8px;
    line-height: 1;
    white-space: nowrap;
    font-size: 14px;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    letter-spacing: 0.2px;
    color: var(--secondary-text-color);
  }
  &:disabled,
  &[disabled] {
    background: var(--accent-disabled-color) !important;
    color: var(--text-color) !important;
    opacity: 0.6;
    cursor: not-allowed !important;
    pointer-events: none !important;
  }
}
</style>
