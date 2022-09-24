<template>
  <div>
    <div :id="item.type" v-if="isDefaultType" class="visualization-item" :class="{ selected: isSelected }" @click.stop="handClickItem">
      <div class="text-center">
        <img :src="require(`@/assets/icon/charts/${item.src}`)" class="ic-48 unselectable" alt="chart" />
      </div>
      <div class="text-center title unselectable" style="cursor: pointer">{{ item.title }}</div>
    </div>
    <div
      :id="item.type"
      v-if="isMiniType"
      v-b-tooltip.ds1000.dh010.top.viewport
      :title="item.title"
      class="visualization-item-mini"
      :class="{ selected: isSelected }"
      @click.stop="handClickItem"
    >
      <div class="text-center">
        <img :src="require(`@/assets/icon/charts/${item.src}`)" class="unselectable" alt="chart" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { VisualizationItemData } from '@/shared';

@Component
export default class VisualizationItem extends Vue {
  @Prop({ required: true })
  private readonly item!: VisualizationItemData;

  @Prop({ type: String, default: 'default' })
  private readonly type!: 'mini' | 'default';

  @Prop({ type: Boolean, default: false })
  private readonly isSelected!: boolean;

  @Emit('onClickItem')
  private handClickItem(): VisualizationItemData {
    return this.item;
  }

  private get isDefaultType(): boolean {
    return this.type === 'default';
  }

  private get isMiniType(): boolean {
    return this.type === 'mini';
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.visualization-item {
  background-color: var(--chart-icon-bg);
  border-radius: 4px;

  height: 126px;
  margin: 12px;
  padding: 24px 12px;
  width: 118px;
  @include btn-border(var(--chart-icon-bg));

  > div + div {
    margin-top: 12px;
  }

  .ic-48 {
    height: 48px;
    width: 48px;
  }

  .title {
    color: var(--secondary-text-color);
    font-size: 14px;
    font-stretch: normal;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.23px;
    line-height: normal;
    text-align: center;
  }
}

.visualization-item-mini {
  align-items: center;
  background-color: var(--chart-icon-small-bg);
  border-radius: 4px;

  box-shadow: var(--chart-icon-small-shadow);
  display: flex;
  height: 60px;
  margin: 0;
  padding: 10px;
  width: 60px;
  @include btn-border(var(--chart-icon-bg));

  .text-center {
    line-height: 1;

    img {
      height: 100%;
      object-fit: cover;
      width: 100%;
    }
  }
}

.visualization-item,
.visualization-item-mini {
  &.selected {
    border: solid 1px var(--accent);
  }
}
</style>
