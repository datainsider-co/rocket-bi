import { ConfigType, DraggableConfig, VerticalScrollConfigs, VisualizationItemData } from '@/shared';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import DiTab from '@/shared/components/DiTab.vue';
import FilterDraggable from '@/screens/ChartBuilder/ConfigBuilder/FilterPanel/FilterDraggable.vue';
import ConfigDraggable from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDraggable.vue';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

@Component({
  components: {
    DiTab,
    FilterDraggable,
    ConfigDraggable
  }
})
export default class FilterPanel extends Vue {
  private scrollOptions = VerticalScrollConfigs;

  @Prop({ type: Boolean, default: false })
  private isDragging!: boolean;

  @Ref()
  private menu!: any;

  private get itemSelected(): VisualizationItemData {
    return _ConfigBuilderStore.itemSelected;
  }

  private isFilter(item: DraggableConfig): boolean {
    return item.key == ConfigType.filters;
  }

  private isSorting(item: DraggableConfig): boolean {
    return item.key == ConfigType.sorting;
  }
}
