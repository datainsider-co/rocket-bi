<template>
  <Split :gutterSize="16" class="d-flex">
    <SplitArea :size="panelSize[0]" :minSize="0">
      <DatabaseTreeView
        ref="databaseTree"
        :loading="isDatabaseLoading"
        :schemas="databaseSchemas"
        class="left-panel"
        show-columns
        @deleteColumn="onDeleteColumn"
        @dropTable="onDropTable"
        @reload="handleReloadDatabaseInfos"
        @toggleDatabase="onToggleDatabase"
        @updateTable="onUpdateTable"
      >
        <template slot="table-item" slot-scope="{ database, table, toggleTable, isExpandedTable, showTableContextMenu }">
          <div :class="{ active: isSelectedTable(database, table) }" class="table-item" @click.prevent="selectTable(database, table, toggleTable)">
            <a class="px-1 mr-2" href="#" @click.prevent.stop="toggleTable(database, table)">
              <i :class="{ 'fa-rotate-90': isExpandedTable(database, table) }" class="table-icon fa fa-caret-right text-muted mr-0"></i>
            </a>
            <span v-if="table.displayName">{{ table.displayName }}</span>
            <em v-else class="text-muted">{{ table.name }}</em>
            <a class="ml-auto" href="#" @click.prevent.stop="e => showTableContextMenu(e, table)">
              <img alt="" height="12" src="@/assets/icon/charts/ic_more.svg" width="12" />
            </a>
          </div>
        </template>
      </DatabaseTreeView>
    </SplitArea>
    <SplitArea :size="panelSize[1]" :minSize="0">
      <div class="right-panel d-flex flex-column data-schema layout-content-panel">
        <LayoutNoData v-if="!model" icon="di-icon-schema">
          <div v-if="error" class="text-danger">
            <strong>{{ error }}</strong>
          </div>
          <div v-else class="data-management-tips--title">
            <span v-if="isDatabaseLoading">LOADING DATA...</span>
            <span v-else>NO SELECTED TABLE!</span>
          </div>
        </LayoutNoData>
        <!--        <div v-if="!model" class="data-management-tips">-->
        <!--          <div class="data-management-tips&#45;&#45;icon">-->
        <!--            <i class="di-icon-schema"></i>-->
        <!--          </div>-->
        <!--          <div v-if="error" class="data-management-tips&#45;&#45;title text-danger">-->
        <!--            <strong>{{ error }}</strong>-->
        <!--          </div>-->
        <!--          <div v-else class="data-management-tips&#45;&#45;title">-->
        <!--            <span v-if="loadingDatabaseSchemas">LOADING DATA...</span>-->
        <!--            <span v-else>NO SELECTED TABLE!</span>-->
        <!--          </div>-->
        <!--        </div>-->
        <TableManagement
          v-else-if="viewingDatabase"
          :model="model"
          :isLoading="dbLoadingMap[model.database.name]"
          @dropDatabase="onDropDatabase"
          @dropTable="onDropTable"
          @onClickTable="selectTable(model.database, arguments[0])"
          @updateDatabase="updateDatabaseSchema"
          @onCreatedTable="handleSubmitTableName(model.database, ...arguments)"
        />
        <FieldCreationManagement
          v-else-if="creatingSchema"
          :model="model"
          :view-mode="viewMode"
          @cancel="selectTable(model.database)"
          @created="handleCreatedTable"
        />
        <template v-else>
          <div class="data-schema-header justify-content-between">
            <div class="d-flex text-truncate overflow-hidden align-items-center">
              <i class="fa fa-database text-muted"> </i>
              <span class="data-schema-header--dbname cursor-pointer" @click="selectTable(model.database)">
                <span v-if="model.database.displayName"> {{ model.database.displayName }} </span>
                <em v-else> {{ model.database.name }} </em>
              </span>
              <i class="fa fa-angle-right text-muted"> </i>
              <span v-if="true" class="data-schema-header--tblname"> {{ model.table.name }} </span>
              <!--              <em v-else class="data-schema-header&#45;&#45;tblname"> {{ model.table.name }} </em>-->
            </div>
            <div v-if="!isMobile" class="d-flex align-items-center">
              <template v-if="isRLSViewMode">
                <div class="rls-actions d-flex align-items-center">
                  <DiButton title="Edit RLS" @click="changeViewMode(7)">
                    <i class="di-icon-edit"></i>
                  </DiButton>
                  <DiIconTextButton id="schema-action" title="Action" @click="showActionMenu">
                    <i class="di-icon-setting"></i>
                  </DiIconTextButton>
                </div>
              </template>
              <template v-else-if="isRLSEditMode">
                <div class="rls-actions d-flex align-items-center">
                  <DiButton title="Add RLS" @click="handleAddRLS">
                    <i class="di-icon-add"></i>
                  </DiButton>
                  <DiButton class="rls-cancel" border title="Cancel" @click="handleCancelRLSChanged"></DiButton>
                  <DiButton class="rls-save" primary title="Save" @click="handleSaveRLS"></DiButton>
                </div>
              </template>
              <template v-else-if="!editingSchema">
                <DiIconTextButton
                  v-if="!isReadonlyTable && !viewingMeasure && !isCalculatedFieldEditMode"
                  :id="genBtnId('edit-mode')"
                  class="mr-2 d-none d-sm-flex"
                  title="Edit"
                  @click="changeViewMode(2)"
                >
                  <i class="di-icon-edit icon-title"></i>
                </DiIconTextButton>

                <DiIconTextButton
                  v-if="isCalculatedFieldEditMode && model.table"
                  :id="genBtnId('add-calculated-field')"
                  class="mr-2 d-sm-flex"
                  title="Add Calculated Field"
                  @click="addCalculatedField"
                >
                  <i class="di-icon-add icon-title"></i>
                </DiIconTextButton>
                <DiIconTextButton
                  v-if="isMeasureView && model.table"
                  :id="genBtnId('add-measure-function')"
                  class="mr-2 d-sm-flex"
                  title="Add Measure Function"
                  @click="addMeasureFunction"
                >
                  <i class="di-icon-add icon-title"></i>
                </DiIconTextButton>
                <DiIconTextButton id="schema-action" title="Action" @click="showActionMenu">
                  <i class="di-icon-setting"></i>
                </DiIconTextButton>
              </template>
              <template v-else>
                <DiIconTextButton :id="genBtnId('add-column')" class="" title="Add column" @click="handleAddColumn">
                  <i class="di-icon-add icon-title"></i>
                </DiIconTextButton>
                <DiIconTextButton :id="genBtnId('cancel')" class="mr-2" title="Cancel" @click="handleCancel" />
                <DiIconTextButton :id="genBtnId('save')" title="Save" @click="handleSave">
                  <i class="di-icon-save icon-title"></i>
                </DiIconTextButton>
              </template>
            </div>
          </div>
          <div class="data-schema-title">
            <DiButtonGroup :buttons="buttonInfos" class="di-btn-group" />
            <div v-if="(isViewSchema || viewingMeasure || isCalculatedFieldEditMode) && !isProcessing" class="data-schema-title--search">
              <DiSearchInput
                ref="searchInput"
                autofocus
                border
                placeholder="Search columns..."
                :value="columnKeyword"
                @change="value => (columnKeyword = String(value).trim())"
              />
            </div>
            <div v-else-if="isProcessing" class="data-schema-loading">
              <DiLoading class="di-loading" />
              <span>Table is processing...</span>
            </div>
          </div>
          <div class="data-schema-info">
            <div class="data-schema-info--body">
              <ManageRLSPolicy
                ref="manageRLSPolicy"
                :mode="viewMode"
                v-if="(isRLSViewMode || isRLSEditMode) && model.table"
                :table-schema="model.table"
                @loadTableData="queryTableData(model.table)"
              ></ManageRLSPolicy>
              <CalculatedFieldManagement v-else-if="isCalculatedFieldEditMode" ref="calculatedFieldManagement" :model.sync="model" :keyword="columnKeyword" />
              <template v-else>
                <FieldManagement
                  v-if="viewingSchema && model.table"
                  ref="fieldManagement"
                  :status="fieldManagementStatus"
                  :keyword="columnKeyword"
                  :model.sync="model"
                  :view-mode="viewMode"
                />
                <MeasureFieldManagement v-if="viewingMeasure && model.table" ref="measureFieldManagement" :keyword="columnKeyword" :model.sync="model" />
                <StatusWidget v-else-if="loadingTableData"></StatusWidget>
                <ChartHolder
                  v-else-if="tableData"
                  :meta-data="tableData"
                  :widget-setting="previewWidgetSetting"
                  class="result-table position-relative"
                  disableEmptyChart
                  emptyMessage="Empty data"
                  is-hide-shadow
                />
              </template>
            </div>
          </div>
        </template>
      </div>
      <ContextMenu
        zIndex="300"
        id="table-info-menu"
        ref="contextMenu"
        :ignoreOutsideClass="listIgnoreClassForContextMenu"
        minWidth="168px"
        textColor="var(--text-color)"
      />
      <DiRenameModal ref="renameModal" :title="renameModalTitle" />
    </SplitArea>
  </Split>
</template>
<script src="./DataSchema.ctrl.ts" lang="ts"></script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.data-schema {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  text-align: left;
  text-overflow: ellipsis;
  padding: 8px 16px 16px 16px !important;

  .data-schema-title {
    margin: 16px 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;

    .di-btn-group {
      height: 34px;
      margin-right: 12px;

      ::v-deep {
        button {
          white-space: nowrap;
        }
      }
    }

    &--search {
      width: 230px;
    }

    .data-schema-loading {
      display: flex;
      flex-direction: row;
      font-size: 14px;
      letter-spacing: 0.12px;
      align-items: center;
      text-overflow: ellipsis;

      ::v-deep {
        .loading-container {
          height: 16px;
          width: 16px;
        }
      }

      > span {
        margin-left: 8px;
        line-height: normal;
      }
    }

    @media screen and (max-width: 800px) {
      &--search {
        width: 180px;
      }
    }
    @media screen and (max-width: 650px) {
      &--search {
        display: none;
      }
    }

    @media screen and (max-width: 450px) {
      .data-schema-loading {
        display: none;
      }
    }
  }

  .data-schema-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    height: 42px;

    .data-schema-header--dbname {
      margin: 0 10px;
      font-weight: 500;
    }

    .data-schema-header--tblname {
      margin: 0 10px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rls-actions {
      .rls-save,
      .rls-cancel {
        width: 82px;
      }

      .di-button {
        height: 26px;
        @include medium-text(14px, 0.2px, normal);
        font-family: Barlow;
        font-weight: normal;
        color: var(--secondary-text-color);

        &:not(:last-child) {
          margin-right: 12px;
        }
      }
    }
  }

  .data-schema-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    .data-schema-info--body {
      flex: 1;
      overflow: hidden;

      //// remove: header color
      //--header-color: unset;

      .result-table ::v-deep .empty-widget {
        background-color: var(--panel-background-color);
      }

      .result-table ::v-deep .table-chart-container .table-chart-pagination-content {
        --header-background-color: var(--accent);
        --table-page-active-color: white;
      }
    }
  }

  ::v-deep {
    .table-container,
    .infinite-table {
      //overflow: auto;
      //box-shadow: 0 2px 8px 0 #0000001a;
      border-radius: 4px;
      max-height: 100%;

      table {
        margin-bottom: 0 !important;
        border-collapse: separate;
        border-spacing: 0;

        td,
        th {
          padding: 4px 12px;
          font-size: 14px;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 1;

          th {
            border-top: none;
            background-color: var(--header-background-color, #131d26);
            color: var(--table-header-color, #ffffff);
          }
        }

        tbody {
          tr {
            &.even td {
              background-color: var(--row-even-background-color, #00000033);
              color: var(--row-even-color, #ffffffcc);
            }

            &.odd td {
              background-color: var(--row-odd-background-color, #0000001a);
              color: var(--row-odd-color, #ffffffcc);
            }
          }
        }

        tr {
          th,
          td {
            border: none;
            border-right: 1px solid #ffffff14;
            border-bottom: 1px solid #f0f0f0;
          }

          .active {
            color: var(--active-status-color);
          }

          .suspend {
            color: var(--suspend-status-color);
          }

          .disabled {
            opacity: 0.5;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          .cell-20 {
            width: 20%;
          }

          .cell-15 {
            width: 15%;
          }

          .cell-5 {
            width {
              width: 5%;
            }
          }

          .default-value-cell {
            .input-calendar {
              width: 100%;
              font-size: 0.875rem;
              height: calc(1.5em + 0.75rem);

              &::placeholder {
                font-size: 0.75rem;
              }
            }
          }

          .dropdown-cell {
            .select-container > .relative > span > button {
              height: 34px;

              > div .dropdown-input-placeholder {
                z-index: 0;
              }
            }
          }
        }

        tr:last-child:first-child {
          th,
          td {
            border: none;
            border-right: 1px solid #ffffff14;
          }
        }
      }
    }

    .table-chart-container {
      padding: 0;

      .table-chart-header-content {
        display: none;
      }

      //.table-chart-table-content {
      //  background: var(--panel-background-color);
      //}
    }
  }
}
</style>
<style scoped>
.left-panel,
.right-panel {
  width: 100% !important;
  min-width: unset !important;
  max-width: unset !important;
  min-height: 100%;
  height: 100%;
}
</style>
