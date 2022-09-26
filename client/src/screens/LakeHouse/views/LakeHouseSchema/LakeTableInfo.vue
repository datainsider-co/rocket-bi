<template>
  <StatusWidget :status="currentStatus" class="lake-table-info">
    <template v-if="tableInfo">
      <div class="lake-table-info-body">
        <template>
          <header>
            <div class="header--info">
              <i class="di-icon-table mr-2"></i>
              <span v-b-tooltip="tableInfo.tableName"><strong>Table details</strong> - {{ tableInfo.tableName }}</span>
            </div>
            <div class="header--action-bar">
              <DiIconTextButton id="lake-table-query" title="Query" @click="navigateToQuerySchema(tableInfo.tableName)">
                <i class="di-icon-schema"></i>
              </DiIconTextButton>
              <DiIconTextButton v-if="!isMobile" id="lake-table-action" title="Action" @click="showActionMenu">
                <i class="di-icon-setting"></i>
              </DiIconTextButton>
            </div>
          </header>
        </template>
        <template>
          <div class="lake-table-detail container-fluid">
            <div class="row">
              <div class="col"><strong>Table Name:</strong> {{ tableInfo.tableName }}</div>
              <div class="col"><strong>Owner:</strong> {{ tableInfo.ownerId }}</div>
            </div>
            <div class="row">
              <div class="col"><strong>Description:</strong> {{ tableInfo.description || '--' }}</div>
              <div class="col"><strong>Access Type:</strong> {{ formatDisplayAccessType(tableInfo.accessType) }}</div>
            </div>
            <div class="row">
              <div class="col"><strong>Created Time:</strong> {{ formatDisplayTime(tableInfo.createTime) }}</div>
              <div class="col pick-source">
                <strong>Sources:</strong>
                <div class="source-info" id="lake-source-detail" tabindex="-1">
                  <a class="mr-1" href="#" @click.prevent="viewFile(tableInfo.dataSource[0])">{{ tableInfo.dataSource[0] || '--' }}</a>
                  <div class="cursor-pointer" @click.prevent="showSourceListing">
                    <DownIcon></DownIcon>
                  </div>
                </div>
                <LakeSourcePopover
                  ref="lakeSourcePopover"
                  targetId="lake-source-detail"
                  :sources="tableInfo.dataSource"
                  @onClickSource="viewFile"
                ></LakeSourcePopover>
              </div>
            </div>
            <div class="row">
              <div class="col"><strong>Last Access Time:</strong> {{ formatDisplayTime(tableInfo.lastAccessTime) }}</div>
            </div>
          </div>
        </template>
        <div ref="tableElement" class="lake-table-data">
          <DiTable
            id="lake-table-info"
            :allowShowEmpty="false"
            :error-msg="msg"
            :get-max-height="getMaxHeight"
            :headers="headers"
            :is-show-pagination="false"
            :records="records"
            :status="tableStatus"
            :total="total"
            disableSort
            @onRetry="handleLoadTableData(tableInfo)"
          ></DiTable>
        </div>
      </div>
      <ContextMenu
        id="lake-table-info-menu"
        ref="contextMenu"
        :ignoreOutsideClass="listIgnoreClassForContextMenu"
        minWidth="168px"
        textColor="var(--text-color)"
      />
    </template>
    <template>
      <EmptyWidget>
        <template #icon>
          <i class="di-icon-schema mb-1" style="font-size: 48px"></i>
        </template>
        Schema Not Found
      </EmptyWidget>
    </template>
  </StatusWidget>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { AccessType, CheckQueryResponse, CheckRequest, QueryAction, QueryService, TableInfo } from '@core/LakeHouse';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { ContextMenuItem, Routers, Status } from '@/shared';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import { ChartUtils, DateTimeFormatter } from '@/utils';
import DownIcon from '@/shared/components/Icon/DownIcon.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import DiTable from '@/shared/components/Common/DiTable/DiTable.vue';
import { HeaderData, RowData } from '@/shared/models';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { Inject } from 'typescript-ioc';
import { LakeHouseSchemaUtils } from '@core/LakeHouse/Utils/LakeHouseSchemaUtils';
import LakeSQLQueryComponent from '@/screens/LakeHouse/Components/QueryBuilder/LakeSQLQueryComponent';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { Modals } from '@/utils/modals';
import LakeSourcePopover from '@/screens/LakeHouse/Components/SchemaManagement/LakeSourcePopover.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: { DiTable, DownIcon, DiIconTextButton, StatusWidget, EmptyWidget, ContextMenu, LakeSourcePopover }
})
export default class LakeTableInfo extends Vue {
  private headers: HeaderData[] = [];
  private records: RowData[] = [];
  private total = 0;
  private msg = '';
  private tableStatus = Status.Loading;
  private listIgnoreClassForContextMenu = ['btn-icon-text'];

  @Prop({ required: false })
  private readonly tableInfo?: TableInfo | null;

  @Prop({ required: true })
  private readonly isLoading!: boolean;

  @Inject
  private readonly queryService!: QueryService;

  @Ref()
  private readonly tableElement!: HTMLDivElement;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Ref()
  private readonly lakeSourcePopover!: LakeSourcePopover;

  private get currentStatus(): Status {
    if (this.isLoading) {
      return Status.Loading;
    } else {
      return Status.Loaded;
    }
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  @Watch('tableInfo', { immediate: true })
  private onTableNamedChanged(tableInfo: TableInfo, oldTableInfo: TableInfo) {
    if (tableInfo && tableInfo.id !== oldTableInfo?.id) {
      this.handleLoadTableData(tableInfo);
    }
  }

  reload() {
    if (!this.isLoading && this.tableInfo) {
      this.handleLoadTableData(this.tableInfo);
    }
  }

  private getMaxHeight(isShowPagination: boolean): number {
    return this.tableElement.clientHeight;
  }

  private async handleLoadTableData(tableInfo: TableInfo) {
    try {
      this.tableStatus = Status.Loading;
      const response: CheckQueryResponse = await this.getTableData(tableInfo.tableName);
      this.renderTable(tableInfo, response);
      this.tableStatus = Status.Loaded;
    } catch (ex) {
      this.showTableError(ex.message);
    }
  }

  private renderTable(tableInfo: TableInfo, response: CheckQueryResponse) {
    const tableResponse = LakeHouseSchemaUtils.toPreviewLakeSchema(tableInfo, response);
    this.headers = tableResponse.headers;
    this.records = tableResponse.records;
    this.total = Math.floor(tableResponse.total / LakeSQLQueryComponent.BytesPerRow);
  }

  private formatDisplayAccessType(accessType: AccessType) {
    if (accessType == AccessType.Public) {
      return 'Public';
    }
    return 'Private';
  }

  private formatDisplayTime(time: number): string {
    return DateTimeFormatter.formatAsDDMMYYYYHM(time);
  }

  @Track(TrackEvents.LakeSchemaSelectSourcePath, {
    path: (_: LakeTableInfo, args: any) => args[0]
  })
  private viewFile(path: string): void {
    const absolutePath = RouterUtils.getAbsolutePath(path);
    RouterUtils.to(Routers.LakeExplorer, { query: { path: absolutePath } });
  }

  private showTableError(message: string) {
    this.tableStatus = Status.Error;
    this.msg = message || 'Unknown error';
  }

  private getTableData(tableName: string) {
    const query = `select *
                   from ${FormulaUtils.escape(tableName)}`;
    return this.queryService.action(QueryAction.Check, new CheckRequest(query)).then(resp => CheckQueryResponse.fromObject(resp));
  }

  @Track(TrackEvents.LakeSchemaClickQuery, {
    table_name: (_: LakeTableInfo, args: any) => args[0]
  })
  private navigateToQuerySchema(tableName: string) {
    RouterUtils.to(Routers.LakeQueryEditor, { query: { tableName: tableName } });
  }

  private showActionMenu(event: MouseEvent) {
    const actions = this.getMenuAction(this.tableInfo!);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'lake-table-action', 80);
    this.contextMenu.show(buttonEvent, actions);
  }

  private getMenuAction(tableInfo: TableInfo): ContextMenuItem[] {
    return [
      {
        text: 'Edit Table',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onEditTable', tableInfo);
          TrackingUtils.track(TrackEvents.LakeSchemaEditTable, {
            table_id: tableInfo.id,
            table_name: tableInfo.tableName,
            sources: tableInfo.dataSource.join(',')
          });
        }
      },
      {
        text: 'Export Table',
        disabled: true,
        click: () => {
          this.contextMenu.hide();
        }
      },
      {
        text: 'Delete Table',
        click: () => {
          this.contextMenu.hide();
          TrackingUtils.track(TrackEvents.LakeSchemaDeleteTable, { table_id: tableInfo.id });
          Modals.showConfirmationModal(`Are you sure to delete ${tableInfo.tableName}?`, {
            onOk: () => this.emitDeleteTable(tableInfo.id)
          });
        }
      }
    ] as ContextMenuItem[];
  }

  @Emit('onDeleteTable')
  private emitDeleteTable(tableId: string) {
    return tableId;
  }

  private showSourceListing() {
    this.lakeSourcePopover.show();
  }
}
</script>

<style lang="scss">
.lake-table-info {
  overflow: hidden;

  .lake-table-info-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: 16px;

    header {
      align-items: center;
      cursor: default;
      display: flex;
      flex-direction: row;

      .header--info {
        flex: 5;
        margin-right: 8px;
        overflow: hidden;
        text-align: left;
        text-overflow: ellipsis;

        > span {
          white-space: nowrap;
        }
      }

      .header--action-bar {
        display: flex;

        > div + div {
          margin-left: 10px;
        }

        > div {
          //min-width: 80px;
        }
      }
    }

    .lake-table-detail {
      background: #f9faff;
      border-radius: 4px;
      color: var(--text-secondary-color);
      margin-top: 8px;
      min-height: 132px;
      padding: 16px;
      text-align: left;

      div.row + div.row {
        margin-top: 8px;
      }

      .row > .col {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.pick-source {
          display: flex;

          .source-info {
            align-items: center;
            display: flex;
            margin-left: 4px;
            overflow: hidden;

            > a {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
    }

    .lake-table-data {
      display: flex;
      flex: 1;
      flex-direction: column;
      height: 100%;
      margin-top: 16px;
      overflow: hidden;

      .di-table {
        height: 100%;
      }
    }
  }
}
</style>
