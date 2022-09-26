<template>
  <div class="detail-file">
    <header>
      <span
        >Show <strong>{{ size }}</strong> of {{ maxSize }} {{ sizeUnit }}</span
      >
      <div class="detail-file--header-right">
        <ListingFooter
          v-if="enablePagination"
          ref="footer"
          :default-row-per-page="defaultPageSize"
          :hide-total="true"
          :total-rows="totalRows"
          class="di-table-footer"
          @onPageChange="emitPageChange"
        ></ListingFooter>
        <div class="detail-file--header-right-icon-bar">
          <i class="di-icon-reset btn-icon-border icon-button" @click="emitClickRefresh"></i>
          <i id="detail-file-see-more" class="di-icon-three-dot-horizontal btn-icon-border icon-button" @click="handleClickMore"></i>
        </div>
        <ContextMenu
          id="detail-properties-context"
          ref="contextMenu"
          :ignore-outside-class="['di-icon-three-dot-horizontal']"
          minWidth="168px"
          textColor="var(--text-color)"
        />
      </div>
    </header>
    <template v-if="isParquetFile">
      <DiTable
        :allowShowEmpty="false"
        :disableSort="true"
        :headers="headers"
        :isShowPagination="false"
        :records="records"
        :status="1"
        :total="totalRows"
        class="detail-file--parquet"
        errorMsg=""
      />
    </template>
    <template v-else>
      <div class="detail-file--text">
        <vuescroll>
          <div class="file-content">
            <template v-for="(text, index) in response.data">
              <p :key="index">
                <samp>{{ text }}</samp>
              </p>
            </template>
          </div>
        </vuescroll>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ContextMenuItem, DefaultPaging } from '@/shared';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import LakeSQLQueryComponent from '@/screens/LakeHouse/Components/QueryBuilder/LakeSQLQueryComponent';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import { FieldMappingInfo, LakeFieldType, ParquetTableResponse, ReadFileResponse } from '@core/LakeHouse';
import { zip, zipObject } from 'lodash';
import { LakeHouseSchemaUtils } from '@core/LakeHouse/Utils/LakeHouseSchemaUtils';
import ParquetFile from '@/screens/LakeHouse/Components/FileBrowser/Parquet/ParquetFile.vue';

export enum SizeUnit {
  Rows = 'rows',
  Bytes = 'bytes'
}

@Component({
  components: {
    ContextMenu,
    ListingFooter,
    ParquetFile
  }
})
export default class DetailFile extends Vue {
  @Prop({ required: true, type: Number, default: 1024 })
  private readonly size!: number;

  @Prop({ required: true, type: Number, default: DefaultPaging.DefaultLakePageSize })
  private readonly defaultPageSize!: number;

  @Prop({ required: true, type: Object })
  private readonly response!: ReadFileResponse | ParquetTableResponse | null;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isParquetFile!: boolean;

  @Prop({ required: false, type: Boolean })
  private enablePagination!: boolean;
  @Ref()
  private readonly contextMenu!: ContextMenu;

  private get maxSize(): number {
    return this.response?.total ?? 2048;
  }

  private get totalRows(): number {
    if (this.isParquetFile) {
      return this.maxSize;
    } else {
      return this.maxSize / LakeSQLQueryComponent.BytesPerRow;
    }
  }

  private get seeMoreOptions(): ContextMenuItem[] {
    return [
      {
        text: 'Rename',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickRename');
        }
      },
      {
        text: 'Properties',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickProperties');
        }
      },
      {
        text: 'Download',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickDownload');
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickDelete');
        }
      }
    ];
  }

  //Using for parquet file
  private get headers(): HeaderData[] {
    if (this.isParquetFile) {
      const { data } = this.response as ParquetTableResponse;
      return data.map(column => this.buildHeader(column));
    }
    return [];
  }

  //Using for parquet file
  private get records(): RowData[] {
    if (this.isParquetFile) {
      const { data } = this.response as ParquetTableResponse;
      const transposedSampleData: any[] = zip(...data.map(column => column.sampleData));
      const columnNames: string[] = data.map(column => column.name);
      return (transposedSampleData.map(row => zipObject(columnNames, row)) as any) as RowData[];
    }
    return [];
  }

  private get sizeUnit(): string {
    if (this.isParquetFile) {
      return SizeUnit.Rows;
    } else {
      return SizeUnit.Bytes;
    }
  }

  @Emit('onPageChange')
  private emitPageChange(pagination: Pagination) {
    return pagination;
  }

  private handleClickMore(event: MouseEvent) {
    const newEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'detail-file-see-more', 16, 8);
    this.contextMenu.show(newEvent, this.seeMoreOptions);
  }

  @Emit('onClickRefresh')
  private emitClickRefresh(event: MouseEvent) {
    return event;
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

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

.detail-file {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 100%;

  > header {
    align-items: center;
    background: var(--data-source-item-bg);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-content: end;
    padding: 15px;

    span {
      @include regular-text(0.23px, var(--secondary-text-color));
    }

    @media screen and (max-width: 865px) {
      span {
        display: none;
      }
    }

    > div.detail-file--header-right {
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: end;
      --panel-background-color: transparent;

      > div.detail-file--header-right-icon-bar {
        margin-left: 24px;

        > i {
          font-size: 18px;
        }

        > i + i {
          margin-left: 16px;
        }
      }
    }
  }

  &--text {
    flex: 1;
    margin: 16px;
    overflow: hidden;

    .file-content {
      font-size: 14px;
      @include regular-text(0.23px, var(--secondary-text-color));
      text-align: left;
      max-height: 100vh;

      p {
        margin-bottom: 0;

        samp {
          cursor: text;
          @include regular-text(0.23px, var(--secondary-text-color));
          font-size: 16px;
          line-height: 1.8;
          font-family: $roboto-font-family;
          white-space: pre;
        }
      }
    }
  }

  &--parquet {
    overflow: hidden;
    flex: 1;
  }
}
</style>
