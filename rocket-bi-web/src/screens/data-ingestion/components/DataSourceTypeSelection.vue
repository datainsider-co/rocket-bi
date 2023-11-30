<template>
  <VisualizeSelectionModal
    :isShow.sync="isShowSync"
    title="Add DataSource"
    sub-title="Select DataSource Type"
    :all-items="dataSourceList"
    :no-close-on-esc="false"
    :no-close-on-backdrop="false"
    class="visualization-panel mb-3"
    @onItemSelected="handleItemSelected"
  >
    <template #default="{item, index, onClickItem}">
      <DataSourceItem :item="item" :key="index" :data-source="item.type" @onClickItem="onClickItem"> </DataSourceItem>
    </template>
  </VisualizeSelectionModal>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { ALL_DATASOURCE } from '@/screens/data-ingestion/constants/Datasource';
import { ItemData, VisualizationItemData } from '@/shared';
import DataSourceItem from '@/screens/data-ingestion/components/DataSourceItem.vue';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';

@Component({
  components: { DataSourceItem, VisualizeSelectionModal }
})
export default class DataSourceTypeSelection extends Vue {
  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  readonly dataSourceList: ItemData[] = ALL_DATASOURCE;

  handleItemSelected(selectedDataSource: VisualizationItemData) {
    this.$emit('onDataSourceTypeSelected', selectedDataSource);
  }
}
</script>
