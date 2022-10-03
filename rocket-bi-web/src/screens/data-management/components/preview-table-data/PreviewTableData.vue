<template>
  <div class="preview-table-data">
    <LoadingComponent v-if="loading"></LoadingComponent>
    <ChartHolder v-else-if="data" :meta-data="data" class="position-relative" :retry="retry" :disableEmptyChart="disableEmptyChart">
      <template #default="slotScope">
        <slot v-bind="slotScope"></slot>
      </template>
    </ChartHolder>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import { ChartInfo, QuerySetting, RawQuerySetting, TableChartOption, TableSchema, WidgetCommonData } from '@core/common/domain';
import debounce from 'lodash/debounce';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { ChartInfoUtils, ChartUtils, SchemaUtils } from '@/utils';
import { IdGenerator } from '@/utils/IdGenerator';
import { Pagination } from '@/shared/models';
import { Status } from '@/shared';
import { _ChartStore, DashboardControllerModule, QuerySettingModule } from '@/screens/dashboard-detail/stores';

@Component({
  components: {
    ChartHolder
  }
})
export default class PreviewTableData extends Vue {
  private data: ChartInfo | null = null;
  private loading = false;
  private chartIdsAsMap = new Map<string, number>();

  @Prop({ type: Object, default: () => null })
  private tableSchema?: TableSchema;

  @Prop({ type: Boolean, default: false })
  private readonly disableEmptyChart!: boolean;

  @Prop({ type: Function, required: false })
  private readonly retry!: Function | null;

  private mounted() {
    this.getData();
  }

  private getData = debounce(() => {
    if (this.tableSchema) {
      this.queryTableData();
    } else {
      this.data = null;
    }
  }, 300);

  private getOrNewId(dbName: string, tblName: string): number {
    const key = IdGenerator.generateKey([dbName, tblName]);
    if (this.chartIdsAsMap.has(key)) {
      return this.chartIdsAsMap.get(key)!;
    } else {
      const id = ChartInfoUtils.getNextId();
      this.chartIdsAsMap.set(key, id);
      return id;
    }
  }

  private async queryTableData() {
    this.data = null;
    if (this.tableSchema) {
      const id = this.getOrNewId(this.tableSchema.dbName, this.tableSchema.name);
      this.data = this.buildChartInfo(id, this.tableSchema);
      await this.renderChart(this.data);
    }
  }

  private async renderChart(chartInfo: ChartInfo) {
    this.loading = true;
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    await DashboardControllerModule.renderChart({ id: chartInfo.id, forceFetch: true });
    this.loading = false;
  }

  buildChartInfo(id: number, tableSchema: TableSchema) {
    const querySetting: QuerySetting = SchemaUtils.buildQuery(tableSchema);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    querySetting.setChartOption(defaultChartOption);
    const commonSetting: WidgetCommonData = { id: id, name: '', description: '' };
    return new ChartInfo(commonSetting, querySetting);
  }

  @Watch('tableSchema', { deep: true })
  private onTableSchemaChange() {
    this.getData();
  }
}
</script>
<style lang="scss" scoped>
.preview-table-data {
  min-height: 200px;
  position: relative;

  ::v-deep .table-chart-container {
    padding: 0;

    .table-chart-header-content {
      display: none;
    }

    //.table-chart-table-content {
    //  background: var(--panel-background-color);
    //}
    .table-chart-pagination-content {
      --header-background-color: var(--accent);
    }
  }
}
</style>
