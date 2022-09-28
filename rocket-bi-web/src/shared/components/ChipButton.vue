<template>
  <div class="d-flex flex-row align-items-center align-items-center chip-area cursor-pointer" @click="$emit('click')">
    <div class="chip-title unselectable mr-1" :title="title">{{ title }}</div>
    <div class="icon-x btn-icon-border" v-if="showIconRemove" @click.stop="$emit('onRemove')">
      <b-icon-x></b-icon-x>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ChipButton extends Vue {
  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: false, type: Boolean, default: true })
  showIconRemove!: boolean;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.chip-area {
  border-radius: 4px;
  background-color: var(--accent);
  padding: 0 8px;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }

  .chip-title {
    cursor: pointer !important;
    @include regular-text(0.17px, var(--accent-text-color));
    font-size: 12px;
    line-height: 1;
    padding: 2px 0;

    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .icon-x {
    box-sizing: border-box;
    font-size: 12px;
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
