<template>
  <div class="db-tree-view">
    <vuescroll class="db-tree-view-scroller" ref="vs">
      <div class="db-sidebar-title">
        <div class="db-sidebar-title-body">
          <span v-if="!isShowKeyword">
            <span class="text-nowrap">
              DATABASE
              <span v-if="!loading">({{ schemas.length }})</span>
            </span>
            <i v-if="loading" class="fa fa-spin fa-spinner"></i>
            <div class="db-sidebar-title-actions" v-else>
              <slot name="header-action"></slot>
              <i class="di-icon-reset btn-icon-border icon-button mr-2" @click.prevent="emitReloadData" :event="trackEvents.DatabaseTreeViewRefresh"></i>
              <i :class="{ 'd-none': isDisableCreateMode }" class="di-icon-add btn-icon-border icon-button mr-2" @click.prevent="showCreateDatabaseModal"></i>
              <a class="btn-icon-border icon-button" @click.prevent="showKeyword" href="#">
                <img src="@/assets/icon/ic_search.svg" width="16" height="16" alt="" />
              </a>
            </div>
          </span>
          <div v-else class="input-group">
            <b-input
              ref="keyword"
              :id="genInputId('database-tree-view-search')"
              v-model.trim="keyword"
              :debounce="300"
              @blur="hideKeyword"
              type="text"
              class="form-control"
              placeholder="Search database & table..."
            />
            <span class="input-group-append">
              <a @click.prevent="resetKeyword" href="#">
                <img src="@/assets/icon/ic_close.svg" width="32" height="32" alt="" />
              </a>
            </span>
          </div>
        </div>
      </div>
      <div>
        <ul class="db-tree-view-body">
          <li
            @click.prevent="toggleDatabase(database)"
            v-for="database in filteredDatabaseSchemas"
            :key="database.name"
            :id="`database-name-${database.name}`"
            :data-database="database.name"
          >
            <div class="db-item">
              <i class="di-icon-database text-muted"></i>
              <div class="flex-grow-1 ml-2 mr-2">
                <span v-if="database.displayName">{{ database.displayName }}</span>
                <em v-else class="text-muted">{{ database.name }}</em>
              </div>
              <span v-if="loading" class="fa fa-spinner fa-spin ml-auto"></span>
              <a v-else @click.prevent.stop="toggleDatabase(database)" href="#" class="ml-auto text-muted">
                <i class="fa fa-angle-right" :class="{ 'fa-rotate-90': isExpandedDatabase(database) }"></i>
              </a>
            </div>
            <ul @click.prevent.stop v-if="isExpandedDatabase(database)" class="table-list">
              <li v-if="database.tables.length <= 0">
                <em class="table-item text-muted">No tables</em>
              </li>
              <!--            @click.prevent="selectTable(tb)"-->
              <li v-for="table in database.tables" :key="table.name">
                <slot name="table-item" v-bind="{ database, table, toggleTable, isExpandedTable, showColumns, showTableContextMenu }">
                  <div class="table-item" @click.prevent.stop="toggleTable(database, table)">
                    <a v-if="showColumns" href="#" class="px-1 mr-2">
                      <i class="table-icon fa fa-caret-right text-muted mr-0" :class="{ 'fa-rotate-90': isExpandedTable(database, table) }"></i>
                    </a>
                    <span v-if="table.displayName">{{ table.displayName }}</span>
                    <em v-else class="text-muted">{{ table.name }}</em>
                    <template>
                      <i
                        v-if="mode === DatabaseTreeViewMode.Editing"
                        class="di-icon-three-dot ml-auto btn-icon-border icon-button"
                        @click.prevent.stop="e => showTableContextMenu(e, table)"
                      ></i>
                      <i
                        v-else-if="mode === DatabaseTreeViewMode.QueryMode"
                        class="di-icon-double-arrow ml-auto btn-icon-border icon-button"
                        @click.prevent.stop="handleClickTable(table)"
                      ></i>
                    </template>
                  </div>
                  <!--                <div v-else @click.prevent="toggleTable(db, tb)" class="table-item">-->
                  <!--                  <i v-if="showColumns" class="table-icon fa fa-caret-right text-muted" :class="{ 'fa-rotate-90': isExpandedTable(db, tb) }"></i>-->
                  <!--                  <span v-if="tb.displayName" class="table-name">{{ tb.displayName }}</span>-->
                  <!--                  <em v-else class="text-muted table-name">{{ tb.name }}</em>-->
                  <!--                  <a @click.prevent.stop="e => showTableContextMenu(e, tb)" href="#" class="ml-auto">-->
                  <!--                    <img src="@/assets/icon/charts/ic_more.svg" alt="" width="12" height="12" />-->
                  <!--                  </a>-->
                  <!--                </div>-->
                </slot>
                <ul v-if="showColumns && isExpandedTable(database, table)" @click.stop class="column-list">
                  <li v-if="table.allColumns.length <= 0">
                    <em class="column-item text-muted">No columns</em>
                  </li>
                  <li v-for="col in table.allColumns" :key="col.name" @click.prevent.stop="handleClickField(table.dbName, table.name, col.name)">
                    <slot name="column-item" v-bind="{ database: database, table: table, column: col, getColumnIcon }">
                      <div
                        @contextmenu="e => showColumnContextMenu(e, table, col)"
                        class="column-item"
                        :class="{ 'column-selection': mode === DatabaseTreeViewMode.QueryMode }"
                      >
                        <div class="column-icon">
                          <component :is="getColumnIcon(col)"></component>
                        </div>
                        <div class="column-name">
                          <span v-if="col.displayName">
                            {{ col.displayName }}
                          </span>
                          <em v-else class="text-muted">{{ col.name }}</em>
                        </div>
                      </div>
                    </slot>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <DiRenameModal
        ref="databaseCreationModal"
        @rename="handleCreateDatabase"
        title="Create Database"
        action-name="Create"
        placeholder="Input database name"
        label="Database name"
      ></DiRenameModal>
      <CalculatedFieldModal ref="calculatedFieldModal" @created="onUpdateTable" @updated="onUpdateTable" />
      <VueContext ref="tableMenu" id="table-config">
        <template slot-scope="{ data }">
          <DataListing :records="tableActions" @onClick="handleConfigTable(data.tableSchema, ...arguments)"></DataListing>
        </template>
      </VueContext>
      <VueContext ref="columnMenu" id="column-config">
        <template slot-scope="{ data }">
          <DataListing :records="fieldOptions" @onClick="handleConfigColumn(data.tableSchema, data.column, ...arguments)"></DataListing>
        </template>
      </VueContext>
    </vuescroll>
  </div>
</template>
<script src="./DatabaseTreeView.ctrl.ts" lang="ts"></script>
<style lang="scss" scoped>
$primary-color: #272a36;
$secondary-color: var(--secondary);
$card-color: var(--panel-background-color);
$white-color: #fff;
$muted-color: rgba(255, 255, 255, 0.6);
$muted-border-color: rgba(255, 255, 255, 0.1);
$header-color: #4a506a;
$body-color-odd: #2b2e3a;
$body-color-even: #2f3240;
$card-spacing: 16px;
.db-tree-view {
  width: 200px;
  background-color: $card-color;
  border-radius: 4px;
  padding: 0;
  overflow-y: auto;
  margin-right: 20px;

  ::v-deep.db-tree-view-scroller {
    .db-sidebar-title {
      font-weight: 600;
      padding: 10px 6px;
      position: sticky;
      top: 0;
      background-color: var(--panel-filter-color);
      z-index: 1;
    }

    .db-sidebar-title-body {
      height: 34px;
      display: flex;

      & > span {
        flex: 1;
        padding: 0 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .input-group {
        padding: 0 0 0 10px;

        .form-control {
          padding-left: 10px;
        }
      }

      .db-sidebar-title-actions {
        display: flex;
        align-items: center;
        line-height: 1;

        a {
          display: flex;
        }
      }
    }

    .db-tree-view-body {
      list-style: none;
      padding: 0 10px;
      margin-bottom: 20px !important;

      li {
        .db-item {
          min-height: 34px;
          font-weight: 500;
          padding: 8px 6px;
          display: flex;
          cursor: pointer;
          border-radius: 4px;
          align-items: flex-start;
          word-break: break-word;
          text-align: left;

          &,
          * {
            line-height: 1.4;
          }

          &:hover {
            background-color: $secondary-color;
          }
        }
      }

      .table-list {
        list-style: none;
        padding: 0;

        .table-item {
          position: relative;
          text-decoration: none;
          min-height: 34px;
          align-items: flex-start;
          padding: 6px 4px 6px 30px;
          display: flex;
          cursor: pointer;
          border-radius: 4px;
          color: var(--text-color);
          text-align: left;
          word-break: break-word;
          //justify-content: flex-start;
          //align-items: flex-start;

          i.btn-icon-border {
            font-size: 16px;
          }

          &.active {
            color: var(--accent, $white-color);
          }

          .table-name {
            flex: 1;
            word-break: break-word;
          }

          .table-icon {
            margin: 4px 1rem 0 0;
          }

          &:hover {
            background-color: $secondary-color;
          }

          a:hover {
            border-radius: 2px;
            background-color: rgba(246, 245, 245, 0.1);
          }
        }
      }

      .column-list {
        list-style: none;
        padding: 0;
        text-align: left;

        .column-item {
          padding: 6px 4px 6px 50px;
          font-weight: 500;
          display: flex;
          align-items: flex-start;
          cursor: default;

          &:hover {
            border-radius: 4px;
            background-color: $secondary-color;
          }

          &.column-selection {
            cursor: pointer;

            &:hover {
              background: var(--primary);
            }
          }

          .column-icon {
            margin: 0 8px 0 0;
            width: 16px;
            height: 16px;
          }

          .column-name {
            flex: 1;
            word-break: break-word;
          }

          a:hover {
            border-radius: 2px;
            background-color: rgba(246, 245, 245, 0.1);
          }
        }
      }
    }
  }
}
</style>
