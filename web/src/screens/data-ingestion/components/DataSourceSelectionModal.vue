<template>
  <DiCustomCenterModal
    :is-show.sync="isShowSync"
    :ok-disable="disableSubmitModal"
    ok-title="Next"
    sub-title="Config information for DataSource"
    title="Add Jobs"
    @ok="handleSubmitModal"
  >
    <div class="body">
      <div class="select-title">Choose DataSource</div>
      <DiDropdown v-model="selectedDataSourceId" :data="dataSourceOptions" class="swm-select" value-props="type"></DiDropdown>
    </div>
  </DiCustomCenterModal>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import DiCustomCenterModal from '@/screens/data-ingestion/components/DiCustomCenterModal.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DIException, SourceId } from '@core/common/domain';

@Component({
  components: { DiCustomCenterModal }
})
export default class DataSourceSelectionModal extends Vue {
  private idToDataSource: Map<SourceId, DataSourceInfo> = new Map();
  private readonly defaultDataSourceOption: any = {
    label: 'Select please...',
    type: DataSourceInfo.DEFAULT_ID
  };

  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  private selectedDataSourceId = this.dataSourceOptions[0].type;

  private setIdToDataSource() {
    DataSourceModule.dataSources.map(dataSource => {
      this.idToDataSource.set(dataSource.dataSource.id, dataSource.dataSource);
    });
  }

  private get dataSourceOptions(): any[] {
    const dataSourceOptions: any[] = DataSourceModule.dataSources.map(dataSource => {
      return {
        label: dataSource.dataSource.getDisplayName(),
        type: dataSource.dataSource.id
      };
    });
    return [this.defaultDataSourceOption].concat(dataSourceOptions);
  }

  private getDataSourceWithId(id: SourceId): DataSourceInfo {
    this.setIdToDataSource();
    if (this.idToDataSource.has(id)) {
      //@ts-ignored
      return this.idToDataSource.get(id);
    } else {
      throw new DIException(`not found DataSource Id: ${id}`);
    }
  }

  private get disableSubmitModal() {
    return this.selectedDataSourceId === DataSourceInfo.DEFAULT_ID;
  }

  async created() {
    await this.loadDataSources();
  }

  private async loadDataSources() {
    try {
      await DataSourceModule.loadDataSources({ from: 0, size: 1000 });
    } catch (e) {
      const exception = DIException.fromObject(e);
      Log.error('DataSSourceSelectionModal::loadDataSources::exception::', exception.message);
    }
  }

  private handleSubmitModal(e: MouseEvent) {
    if (this.disableSubmitModal) {
      e.preventDefault();
    } else {
      this.$emit('onSubmit', this.getDataSourceWithId(this.selectedDataSourceId));
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.select-title {
  margin-bottom: 16px;
  @include regular-text();
  font-size: 14px;
  color: var(--secondary-text-color);
}
.body {
  width: 490px;
}
.swm-select {
  margin-bottom: 4px;
}
</style>
