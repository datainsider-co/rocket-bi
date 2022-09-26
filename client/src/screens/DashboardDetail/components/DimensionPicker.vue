<template>
  <VueContext ref="dimensionContextMenu" :close-on-click="false" :close-on-scroll="false" class="dimension-context-menu" tag="div" @close="removeListenScroll">
    <template v-if="isEmpty">
      <span>
        There is not any dimension to select
      </span>
    </template>
    <template v-else>
      <header>
        Select a dimension
      </header>
      <template>
        <vuescroll :ops="scrollOptions">
          <DataListing :records="dimensions" key-for-display="label" key-for-value="type" @onClick="onValueSelected"></DataListing>
        </vuescroll>
      </template>
    </template>
  </VueContext>
</template>

<script lang="ts">
import { Ref } from 'vue-property-decorator';
import { DimensionListing } from '@core/domain';
import VueContext from 'vue-context';
import Component from 'vue-class-component';
import { AutoHideContextMenu } from '@/screens/DashboardDetail/components/AutoHideContextMenu';
import { ListUtils } from '@/utils';
import DataListing from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DataListing.vue';
import { LabelNode, VerticalScrollConfigs } from '@/shared';
import { StringUtils } from '@/utils/string.utils';
import { isFunction } from 'lodash';

@Component({
  components: {
    DataListing,
    VueContext
  }
})
export default class DimensionPicker extends AutoHideContextMenu {
  private dimensionListing: DimensionListing | null = null;
  private onDimensionSelected?: (value: string) => void;
  @Ref()
  private readonly dimensionContextMenu?: VueContext;

  private readonly scrollOptions = VerticalScrollConfigs;

  private get dimensions(): LabelNode[] {
    if (this.dimensionListing) {
      return this.dimensionListing
        .getDimensions()
        .sort(StringUtils.compare)
        .map(dimension => {
          return {
            label: dimension?.toString() || '--',
            type: dimension
          };
        });
    } else {
      return [];
    }
  }

  private get isEmpty(): boolean {
    return ListUtils.isEmpty(this.dimensions);
  }

  show(event: MouseEvent, dimensionListing: DimensionListing, onDimensionSelected: (value: string) => void) {
    this.dimensionListing = dimensionListing;
    this.onDimensionSelected = onDimensionSelected;
    this.dimensionContextMenu?.open(event, {});
  }

  hide() {
    this.dimensionContextMenu?.close();
  }

  private onValueSelected(value: string) {
    this.hide();
    if (isFunction(this.onDimensionSelected)) {
      this.onDimensionSelected(value);
    }
  }
}
</script>

<style lang="scss">
div.v-context.dimension-context-menu {
  background: var(--menu-background-color);
  border: var(--menu-border);
  border-radius: 4px;
  box-shadow: var(--menu-shadow);
  display: flex;
  flex-direction: column;
  height: 250px;
  max-height: 350px;
  min-width: 160px;

  overflow: hidden;
  width: 200px;

  > header {
    color: var(--text-color);
    font-weight: 500;
    padding: 8px;
  }

  > span {
    align-items: center;
    display: flex;
    flex: 1;
    padding: 8px;
    text-align: center;
  }
}
</style>
