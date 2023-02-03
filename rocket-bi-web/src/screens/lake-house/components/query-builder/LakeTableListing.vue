<template>
  <StatusWidget :error="msg" :status="status" @retry="handleLoadTables">
    <DatabaseListing
      :isDragging="false"
      :mode="DatabaseListingMode.Query"
      :showSelectDatabase="false"
      class="lake-table-listing"
      @nodeclick="handleNodeClick"
      @clickField="handleClickField"
    >
      <template #header><div style="padding: 8px"></div></template>
      <template #database-header="{keyword, submitKeywordChanged, enableSearch, toggleSearch, blur }">
        <div class="lake-database-header">
          <template v-if="enableSearch">
            <SearchInput id="lake-table-listing" :value="keyword" place-holder="Search tables & columns" @blur="blur" @input="submitKeywordChanged" />
          </template>
          <template v-else>
            <label class="unselectable lake-table-listing--table-name">Tables ({{ numTable }})</label>
            <div class="listing-icon-bar">
              <i class="di-icon-reset btn-icon btn-icon-border" @click="handleLoadTables" :event="trackEvents.LakeSchemaRefreshTable"></i>
              <i class="di-icon-add btn-icon btn-icon-border" v-if="!hideAddButton" @click="emitCreateTable" :event="trackEvents.LakeSchemaCreateTable"></i>
              <div class="cursor-pointer btn-icon btn-icon-border" @click="toggleSearch">
                <img alt="search" src="@/assets/icon/ic_search.svg" />
              </div>
            </div>
          </template>
        </div>
      </template>
    </DatabaseListing>
  </StatusWidget>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import { Inject } from 'typescript-ioc';
import { TableManagementService } from '@core/lake-house/service/TableManagementService';
import { ListTableRequest } from '@core/lake-house/domain/request/table/ListTableRequest';
import { TableInfo } from '@core/lake-house';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { LakeHouseSchemaUtils } from '@core/lake-house/utils/LakeHouseSchemaUtils';
import SearchInput from '@/screens/lake-house/components/query-builder/SearchInput.vue';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Log } from '@core/utils/Log';
import { DIException, Field, TableSchema } from '@core/common/domain';
import { SlTreeNode } from '@/shared/components/builder/treemenu/SlVueTree';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { DatabaseListingMode } from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

@Component({
  components: {
    StatusWidget,
    SearchInput,
    DatabaseListing
  }
})
export default class LakeTableListing extends Vue {
  private readonly trackEvents = TrackEvents;
  private tables: TableInfo[] = [];
  private numTable = 0;
  private status = Status.Loading;
  private msg = '';
  private readonly DatabaseListingMode = DatabaseListingMode;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly hideAddButton!: boolean;

  @Inject
  private tableService!: TableManagementService;

  @Prop({ required: false })
  private defaultTblNameExpanded?: string;

  async handleLoadTables() {
    try {
      this.status = Status.Loading;
      const tables: TableInfo[] = await this.getAllTables();
      this.renderTables(tables);
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('loadTables::', ex);
      this.status = Status.Error;
      this.msg = ex.message;
      throw new DIException(ex.message);
    }
  }

  renderTables(tables: TableInfo[]) {
    this.setTables(tables);
    _BuilderTableSchemaStore.setDatabaseSchema(LakeHouseSchemaUtils.buildLakeDatabase(tables));
    if (this.defaultTblNameExpanded) {
      _BuilderTableSchemaStore.expandTables([this.defaultTblNameExpanded]);
    } else {
      _BuilderTableSchemaStore.expandFirstTable();
    }
  }

  private setTables(tables: TableInfo[]) {
    this.tables = tables;
    this.numTable = tables.length;
    this.emitTablesChanged(tables);
  }

  private async getAllTables(): Promise<TableInfo[]> {
    const tables: TableInfo[] = [];
    const size = 100;

    while (true) {
      const response = await this.tableService.getTables(ListTableRequest.create(tables.length, size));
      tables.push(...response.data);
      if (tables.length >= response.total) {
        return tables;
      }
    }
  }

  @Emit('onTablesChanged')
  private emitTablesChanged(tables: TableInfo[]) {
    return tables;
  }

  private handleNodeClick(node: SlTreeNode<TableSchema>, event: Event) {
    this.$emit('nodeclick', node, event);
  }

  @Emit('createTable')
  private emitCreateTable() {
    return;
  }

  @Emit('clickField')
  private handleClickField(field: Field) {
    return field;
  }
}
</script>

<style lang="scss">
.lake-table-listing {
  overflow: hidden;
  height: 100%;

  .sl-vue-tree-node-is-folder .sl-vue-tree-title {
    font-size: 14px;
    padding: 5px 1px 2px 5px;

    > div {
      display: flex;

      &:first-child > :first-child {
        order: 1;
      }

      &:first-child > :nth-child(2) {
        flex: 1;
        margin-right: 5px;
        overflow: hidden;
        text-overflow: ellipsis;

        .icon-create-field {
          display: none;
        }
      }
    }
  }

  .lake-database-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    label {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color);
      //margin: 0;
    }
    .listing-icon-bar {
      align-items: center;
      display: flex;

      .btn-icon {
        color: #5f6368;
        font-size: 16px;
        height: 16px;
        line-height: 1;
        opacity: 1;
        padding: 4px;
        width: 16px;

        > img {
          height: 16px;
          width: 16px;
        }
      }

      .btn-icon + .btn-icon {
        margin-left: 8px;
      }
    }
  }
}
</style>
