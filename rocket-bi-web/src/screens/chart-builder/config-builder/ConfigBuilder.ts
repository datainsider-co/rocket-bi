/*
 * @author: tvc12 - Thien Vi
 * @created: 7/28/21, 2:07 PM
 */

import Vue from 'vue';
import { Drop } from 'vue-drag-drop';
import { Component, Emit, Prop, Watch } from 'vue-property-decorator';
import { BuilderMode, ConfigType, DraggableConfig, VerticalScrollConfigs, VisualizationItemData } from '@/shared';
import vClickOutside from 'v-click-outside';
import draggable from 'vuedraggable';
import VisualizationItemListing from './chart-selection-panel/VisualizationItemListing.vue';
import ConfigDraggable from '@/screens/chart-builder/config-builder/config-panel/ConfigDraggable.vue';
import FilterDraggable from '@/screens/chart-builder/config-builder/filter-panel/FilterDraggable.vue';
import { QuerySetting } from '@core/common/domain';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

type ChangeConfigCallBack = (querySetting: QuerySetting | null) => void;

@Component({
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    Drop,
    draggable,
    VisualizationItemListing,
    ConfigDraggable,
    FilterDraggable
  }
})
export default class ConfigBuilder extends Vue {
  @Prop({ type: Boolean, default: false })
  private isDragging!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showHeader!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showSorting!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showConfig!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showFilter!: boolean;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly visualizationItems!: VisualizationItemData[];

  private get vizItemsFiltered(): VisualizationItemData[] {
    return this.visualizationItems.filter(vizItem => {
      const isHidden = vizItem.isHidden !== undefined ? vizItem.isHidden : false;
      const useChartBuilder = vizItem.useChartBuilder !== undefined ? vizItem.useChartBuilder : true;
      return !isHidden && useChartBuilder;
    });
  }

  private isItemDragging = false;

  private scrollOptions = VerticalScrollConfigs;

  private changeConfigCallBack: ChangeConfigCallBack | null = null;

  private get hasDragging(): boolean {
    return this.isDragging || this.isItemDragging;
  }

  private get itemSelected(): VisualizationItemData {
    return _ConfigBuilderStore.itemSelected;
  }

  private get chartType(): string {
    return _ConfigBuilderStore.chartType;
  }

  private get draggableConfigs(): DraggableConfig[] {
    return [...this.itemSelected.configPanels];
  }

  private get isShowFilter(): boolean {
    return !!this.filterConfig && this.showFilter;
  }

  private get isShowSorting(): boolean {
    return !!this.sortingConfig && this.showSorting;
  }

  private get filterConfig(): DraggableConfig | undefined {
    return this.itemSelected.extraPanels.find(config => config.key == ConfigType.filters);
  }

  private get sortingConfig(): DraggableConfig | undefined {
    return this.itemSelected.extraPanels.find(config => config.key == ConfigType.sorting);
  }

  setOnSettingChanged(changeConfigCallBack: ChangeConfigCallBack): void {
    this.changeConfigCallBack = changeConfigCallBack;
  }

  handleConfigChange(): void {
    const querySetting: QuerySetting | null = this.getQuerySetting();
    Log.debug('handleConfigChange::', querySetting);
    this.emitQuerySettingChanged(querySetting);
  }

  getQuerySetting(): QuerySetting | null {
    Log.debug('can build query setting', _ConfigBuilderStore.canBuildQuerySetting());
    if (_ConfigBuilderStore.canBuildQuerySetting()) {
      return _ConfigBuilderStore.getQuerySetting();
    } else {
      return null;
    }
  }

  @Emit('onQuerySettingChanged')
  private emitQuerySettingChanged(querySetting: QuerySetting | null) {
    return querySetting;
  }

  @Track(TrackEvents.SelectChartType, { chart_type: (_: ConfigBuilder, args: any) => args[0].type })
  private async handleItemSelectedChanged(item: VisualizationItemData) {
    await _ConfigBuilderStore.setItemSelected(item);
  }

  @Watch('itemSelected', { immediate: true })
  onVizItemChanged() {
    this.handleConfigChange();
  }

  private buildKey(key: string) {
    return `${this.chartType}.${key}`;
  }

  private handleItemDragging(isDragging: boolean, key: string): void {
    this.isItemDragging = isDragging;
  }
}
