<template>
  <EtlModal
    ref="customModal"
    :actionName="actionLabel"
    :loading="isLoading"
    :width="809"
    backName="Back"
    class="modal-container"
    title="Preview Table"
    @back="handleHidden"
    @submit="handleCreateTable"
  >
    <div ref="tableContainer" class="preview-table-container">
      <DiTable
        id="preview-table-data-modal"
        ref="previewTable"
        :error-msg="errorMessage"
        :getMaxHeight="getMaxHeight"
        :headers="headers"
        :isShowPagination="false"
        :records="records"
        :status="tableStatus"
        :total="totalRecord"
      />
    </div>
    <div v-if="isError" class="text-danger text-left">{{ errorMessage }}</div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import {
  CreateTableRequest,
  FieldMappingInfo,
  LakeFieldType,
  ParquetTableResponse,
  TableInfo,
  TableManagementService,
  UpdateTableRequest
} from '@core/lake-house';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { Status } from '@/shared';
import { HeaderData, RowData } from '@/shared/models';
import { zip, zipObject } from 'lodash';
import { MethodProfiler } from '@/shared/profiler/Annotation';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import DiTable from '@/shared/components/common/di-table/DiTable.vue';
import { LakeHouseSchemaUtils } from '@core/lake-house/utils/LakeHouseSchemaUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: { EtlModal }
})
export default class PreviewTableDataModal extends Vue {
  private prepareResponse: ParquetTableResponse | null = null;
  private tableInfo: TableInfo = TableInfo.empty();
  private isEdit = false;

  private errorMessage = '';
  //not use this for set state
  private tableStatus = Status.Loaded;
  //please use this
  private status = Status.Loaded;

  private headers: HeaderData[] = [];
  private records: RowData[] = [];
  private totalRecord = 0;
  @Ref()
  private readonly customModal?: EtlModal;

  @Ref()
  private readonly tableContainer?: HTMLDivElement;

  @Ref()
  private readonly previewTable!: DiTable;

  @Inject
  private readonly tableService!: TableManagementService;

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    // return true;
    return this.status === Status.Loading;
  }

  private get actionLabel() {
    return this.isEdit ? 'Edit' : 'Create';
  }

  show(payload: { response: ParquetTableResponse; table: TableInfo; isEdit: boolean }) {
    this.updateFromPayload(payload);
    this.initTable(payload.response);
    this.showModal();
  }

  handleHidden() {
    this.$emit('onBack', this.tableInfo);
    this.resetModal();
  }

  showError(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.status = Status.Error;
  }

  private hideModal() {
    this.customModal?.hide();
  }

  private resetModal() {
    this.$nextTick(() => {
      this.prepareResponse = null;
      this.tableInfo = TableInfo.empty();
      this.isEdit = false;
    });
  }

  private updateFromPayload(payload: { response: ParquetTableResponse; table: TableInfo; isEdit: boolean }) {
    const { response, table, isEdit } = payload;
    this.isEdit = isEdit;
    this.prepareResponse = response;
    this.tableInfo = table;
  }

  private showModal() {
    this.customModal?.show();
    this.$nextTick(() => {
      this.previewTable.updateMaxHeight();
      this.previewTable.reRender();
    });
  }

  private async handleCreateTable() {
    try {
      this.status = Status.Loading;
      const response = await this.actionTable();
      this.status = Status.Loaded;
      this.$emit('created', response.tableInfo);
      this.resetModal();
      this.hideModal();
    } catch (e) {
      Log.error('TableCreationModal::handleClickOk::error::', e);
      this.showError(e.message);
    }
  }

  @MethodProfiler({ name: 'PreviewTableDataModal:: initTable' })
  private initTable(response: ParquetTableResponse) {
    const { data, total } = response;
    const transposedSampleData: any[] = zip(...data.map(column => column.sampleData));
    const columnNames: string[] = data.map(column => column.name);
    this.records = (transposedSampleData.map(row => zipObject(columnNames, row)) as any) as RowData[];
    this.headers = data.map(column => this.buildHeader(column));
    this.totalRecord = total;
  }

  private buildHeader(column: FieldMappingInfo): HeaderData {
    const notFormat = column.type === LakeFieldType.String;
    return {
      key: `${column.position}`,
      label: column.name,
      disableSort: true,
      isGroupBy: notFormat,
      children: [
        {
          key: column.name,
          label: LakeHouseSchemaUtils.getDisplayNameOfType(column.type, column.type),
          disableSort: true,
          isGroupBy: notFormat
        }
      ]
    };
  }

  private getMaxHeight(isShowPagination: boolean): number {
    return this.tableContainer?.clientHeight || 380;
  }

  private actionTable() {
    if (this.isEdit) {
      const updateRequest = UpdateTableRequest.fromTableInfo(this.tableInfo);
      TrackingUtils.track(TrackEvents.LakeSchemaSubmitEditTable, {
        table_id: this.tableInfo.id,
        table_name: this.tableInfo.tableName,
        table_sources: this.tableInfo.dataSource.join(',')
      });
      return this.tableService.update(updateRequest);
    } else {
      const createRequest = CreateTableRequest.fromTableInfo(this.tableInfo);
      createRequest.updateSchema(this.prepareResponse?.data ?? []);
      TrackingUtils.track(TrackEvents.LakeSchemaSubmitCreateTable, {
        table_id: this.tableInfo.id,
        table_name: this.tableInfo.tableName,
        table_sources: this.tableInfo.dataSource.join(',')
      });
      return this.tableService.create(createRequest);
    }
  }
}
</script>
<style lang="scss">
.preview-table-container {
  height: 380px;
  background: var(--secondary);
  border-radius: 4px;

  .di-table {
    height: 100%;
  }
}
</style>
