<template>
  <div>
    <label>From DataSource</label>
    <div class="input">
      <div class="dropdown-loading">
        <div v-if="dataSourceLoading" class="loading">
          <i class="fa fa-spinner fa-spin"></i>
        </div>
        <DiDropdown
          id="datasource-dropdown"
          v-model="syncJob.sourceId"
          :appendAtRoot="true"
          :data="dataSourceOptions"
          boundary="viewport"
          class="swm-select"
          label-props="label"
          value-props="type"
          @selected="handleSelectDataSource"
        ></DiDropdown>
      </div>
      <template v-if="$v.syncJob.sourceId.$error">
        <div class="error-message mt-1">Select data source, please.</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { DataSourceInfo, Job, SortRequest } from '@core/data-ingestion';
import { DIException, SortDirection } from '@core/common/domain';
import { Log } from '@core/utils';
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { minValue } from 'vuelidate/lib/validators';

@Component({
  components: {},
  validations: {
    syncJob: {
      sourceId: { minValue: minValue(1) }
    }
  }
})
export default class DataSourceConfig extends Vue {
  @PropSync('job')
  syncJob!: Job;

  private dataSourceLoading = false;

  async created() {
    await this.loadFromDataSources();
  }

  private async loadFromDataSources() {
    try {
      this.dataSourceLoading = true;
      const sort = new SortRequest('name', SortDirection.Asc); ///sort theo ABC
      await DataSourceModule.loadDataSources({ from: 0, size: 1000, sorts: [sort] });
    } catch (e) {
      const exception = DIException.fromObject(e);
      Log.error('JobCreationModal::loadDataSources::exception::', exception.message);
    } finally {
      this.dataSourceLoading = false;
    }
  }

  private readonly fromDataSourceDefaultOption: any = {
    label: 'Select data source please...',
    type: DataSourceInfo.DEFAULT_ID,
    isDefaultLabel: true
  };

  private get dataSourceOptions(): any[] {
    const dataSourceOptions: any[] = DataSourceModule.dataSources.map(dataSource => {
      return {
        label: dataSource.dataSource.getDisplayName(),
        source: dataSource.dataSource,
        type: dataSource.dataSource.id
      };
    });
    return [this.fromDataSourceDefaultOption].concat(dataSourceOptions);
  }

  private handleSelectDataSource(item: any) {
    this.$emit('selected', item);
  }
}
</script>

<style lang="scss" scoped>
label {
  line-height: 1;
  margin-bottom: 12px;
}
</style>
