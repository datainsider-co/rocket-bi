<template>
  <ATabs :default-active-key="defaultKey">
    <template v-for="[key, tab] in keyTabAsMap">
      <ATabPane :key="key" :disabled="isDisable(tab[tabKey])" :tab="tab[keyForDisplay]">
        <slot v-bind:tab="tab"></slot>
      </ATabPane>
    </template>
  </ATabs>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DiTab extends Vue {
  @Prop({ required: true, type: Array })
  private readonly tabs!: any[];

  @Prop({ required: true, type: String })
  private readonly keyForDisplay!: string;

  @Prop({ required: false, type: String })
  private readonly tabKey?: string;

  @Prop({ type: Number, default: 0 })
  private readonly defaultActiveIndex!: number;

  @Prop({ required: false, type: String, default: '' })
  private readonly prefixKey!: string;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly disableKeys!: string[];

  private get defaultKey(): string {
    const tab: any = this.tabs[this.defaultActiveIndex];
    return this.getKey(tab, this.defaultActiveIndex);
  }

  private getKey(tab: any, tabIndex: number): string {
    const customKey: string = tab[`${this.tabKey}`] ?? tabIndex.toString();
    return `tab-${customKey}`;
  }

  private isDisable(currentKey: string): boolean {
    return this.disableKeys.some(key => key === currentKey);
  }

  private get keyTabAsMap(): Map<string, any> {
    // TODO: remove duplicated tab (same key)
    const idTabs: [string, any][] = this.tabs.map((tab, index) => [this.getKey(tab, index), tab]);
    return new Map<string, any>(idTabs);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/_tab.scss';
</style>
