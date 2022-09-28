<template>
  <DiTable
    :allowShowEmpty="false"
    :disableSort="true"
    :getMaxHeight="() => $el.clientHeight"
    :headers="headers"
    :isShowPagination="false"
    :records="records"
    :status="1"
    :total="totalRows"
    class="detail-file--parquet"
    errorMsg=""
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DiTable from '@/shared/components/Common/DiTable/DiTable.vue';
import { HeaderData, RowData } from '@/shared/models';
import { FieldMappingInfo, LakeFieldType, ParquetTableResponse } from '@core/LakeHouse';
import { LakeHouseSchemaUtils } from '@core/LakeHouse/Utils/LakeHouseSchemaUtils';
import { zip, zipObject } from 'lodash';

@Component({ components: { DiTable } })
export default class ParquetTable extends Vue {
  @Prop({ required: true, type: Object })
  private readonly response!: ParquetTableResponse | null;

  private get totalRows(): number {
    return this.response?.total ?? 2048;
  }

  private get headers(): HeaderData[] {
    if (this.response) {
      const { data } = this.response as ParquetTableResponse;
      return data.map(column => this.buildHeader(column));
    } else {
      return [];
    }
  }

  private get records(): RowData[] {
    if (this.response) {
      const { data } = this.response as ParquetTableResponse;
      const transposedSampleData: any[] = zip(...data.map(column => column.sampleData));
      const columnNames: string[] = data.map(column => column.name);
      return (transposedSampleData.map(row => zipObject(columnNames, row)) as any) as RowData[];
    } else {
      return [];
    }
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
}
</script>

<style lang="scss" scoped></style>
