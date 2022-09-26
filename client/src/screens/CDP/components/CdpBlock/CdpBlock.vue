<template>
  <div class="cdp-body-content-block p-0">
    <a href="#" @click.prevent="collapsedModel = !collapsedModel" class="cdp-body-content-block-title mb-0 p-3">
      {{ title }}
      <i v-if="!collapsedModel" class="di-icon-arrow-down btn-icon-border ml-auto" style="transform: rotate(180deg)"></i>
      <i v-else class="di-icon-arrow-down btn-icon-border ml-auto"></i>
    </a>
    <div v-if="!collapsedModel" class="cdp-body-content-block-body px-3 pb-3 pt-1">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

@Component({})
export default class CdpBlock extends Vue {
  @Prop({ type: String, default: '' })
  private readonly title!: string;

  @Prop({ type: Boolean, default: false })
  private readonly collapsed!: boolean;

  private collapsedModel: boolean = this.collapsed;

  @Watch('collapsed')
  private onCollapsed() {
    this.collapsedModel = this.collapsed;
  }

  @Watch('collapsedModel')
  private onChangeCollapsedModel() {
    this.$emit('update:collapsed', this.collapsedModel);
    // if (this.collapsedModel !== this.collapsed) {
    // }
  }
}
</script>
