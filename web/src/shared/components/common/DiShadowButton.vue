<template>
  <div :id="id" tabindex="-1" class="di-btn-shadow btn-shadow" @click="emitClick">
    <slot></slot>
    <span class="title unselectable">{{ title }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DiShadowButton extends Vue {
  @Prop({ default: '', type: String })
  private readonly title!: string;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Emit('click')
  private emitClick(event: MouseEvent) {
    return event;
  }
}
</script>

<style lang="scss">
div.di-btn-shadow {
  cursor: pointer;
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  > span {
    line-height: 1;
    white-space: nowrap;
  }
}
</style>
