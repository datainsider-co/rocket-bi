<template>
  <ATabs class="di-tab" :default-active-key="defaultKey" @change="handleChange" size="small">
    <template v-for="tab in tabs">
      <ATabPane :key="tab.key" :disabled="tab.disabled">
        <template #tab>
          <span class="di-tab--content">
            <i v-if="tab.iconClass" :class="tab.iconClass" />
            {{ tab.label }}
          </span>
        </template>
        <slot :name="tab.key" :tab="tab">
          <slot name="default">{{ tab.label }}</slot>
        </slot>
      </ATabPane>
    </template>
  </ATabs>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
export interface DiTabData {
  key: string;
  label: string;
  disabled?: boolean;
  click?: () => void;
  // use icon from di-icon
  iconClass?: string;
}

@Component
export default class DiTab extends Vue {
  @Prop({ required: true, type: Array })
  protected readonly tabs!: DiTabData[];

  @Prop({ type: Number, default: 0 })
  private readonly defaultActiveIndex!: number;

  protected get defaultKey(): string {
    const tab: DiTabData = this.tabs[this.defaultActiveIndex];
    return tab.key;
  }

  protected handleChange(key: string): void {
    const tab: DiTabData = this.tabs.find((t: DiTabData) => t.key === key) as DiTabData;
    if (tab && tab.click) {
      tab.click();
    }
    this.$emit('change', tab);
  }
}
</script>

<style lang="scss">
.di-tab {
  .ant-tabs-nav .ant-tabs-tab {
    padding: 12px 0;

    &:hover,
    &:active {
      color: var(--accent);
    }
  }

  .ant-tabs-bar {
    width: fit-content;
  }

  &--content {
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      margin-right: 12px;
      width: 14px;
      height: 14px;
      font-size: 14px;
      font-style: normal;
    }
  }

  .ant-tabs-tab-active {
    color: var(--accent);

    .di-tab--content {
      font-weight: 700;

      i {
        font-weight: 700;
      }
    }
  }
}
</style>
