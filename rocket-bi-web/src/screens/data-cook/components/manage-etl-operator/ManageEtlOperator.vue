<template>
  <div>
    <div v-if="loading" class="etl-operator-container h-100">
      <div class="etl-operator-container">
        <LoadingComponent></LoadingComponent>
      </div>
    </div>
    <template v-else>
      <div ref="bodyContainer" class="etl-operator-container" :class="[allOperators.length > 0 ? 'h-50' : 'h-100 mb-0']">
        <div v-if="model.getDataItems.length <= 0" class="cdp-body-content-block-nodata">
          <i class="cdp-body-content-block-nodata-icon di-icon-etl"></i>
          <div class="cdp-body-content-block-nodata-msg text-center">
            The first click
            <a @click.prevent="showSelectSourcePopover" href="#" class="font-weight-bold">Add Source</a>
          </div>
        </div>
        <div v-else class="etl-operator-body">
          <DiagramPanel ref="diagramPanel" :position="model.stagePosition">
            <!--              :ref="getTableRef(operator.tableSchema.dbName, operator.tableSchema.name)"-->

            <template v-for="operator in model.getDataItems">
              <TableItem
                @click="e => showSelectOperatorType(operator, e)"
                :id="getDestTableRef(operator.destTableName)"
                :key="getDestTableRef(operator.destTableName)"
                :operator="operator"
                :loading="isLoadingOperator(operator)"
                draggable
              >
              </TableItem>
              <template v-if="operator.persistConfiguration">
                <ArrowConnector
                  :key="'saved_connector' + getDestTableRef(operator.destTableName)"
                  :fromId="getDestTableRef(operator.destTableName)"
                  :toId="'saved' + getDestTableRef(operator.destTableName)"
                ></ArrowConnector>
                <SavedTable
                  @click="e => showSavedTableContextMenu(operator, e)"
                  :id="'saved' + getDestTableRef(operator.destTableName)"
                  :key="'saved' + getDestTableRef(operator.destTableName)"
                  :operator="operator"
                >
                </SavedTable>
              </template>
              <template v-if="operator.emailConfiguration">
                <ArrowConnector
                  :key="getEmailConnectorId(operator.emailConfiguration.subject)"
                  :fromId="getDestTableRef(operator.destTableName)"
                  :toId="getEmailConfigId(operator.emailConfiguration.subject)"
                ></ArrowConnector>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getEmailConfigId(operator.emailConfiguration.subject)"
                  :key="getEmailConfigId(operator.emailConfiguration.subject)"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-if="operator.thirdPartyPersistConfigurations">
                <template v-for="(thirdPartyConfig, index) in operator.thirdPartyPersistConfigurations">
                  <ArrowConnector
                    :key="'saved_connector' + thirdPartyConfig.getId() + index.toString()"
                    :fromId="getDestTableRef(operator.destTableName)"
                    :toId="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                  ></ArrowConnector>
                  <ThirdPartyPersistConfig
                    @click="e => showSavedThirdPartyConfigContextMenu(operator, thirdPartyConfig, index, e)"
                    :id="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                    :key="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                    :operator="operator"
                    :third-party-config-index="index"
                    :third-party-config="thirdPartyConfig"
                  >
                  </ThirdPartyPersistConfig>
                </template>
              </template>

              <!--              <TableSaved v-if="operator.persistConfiguration" :persistConfiguration="operator.persistConfiguration"></TableSaved>-->
            </template>

            <template v-for="operator in model.notGetDataItems">
              <template v-if="operator.isSendToGroupEmail">
                <template v-for="leftOpe in operator.getLeftOperators()">
                  <ArrowConnector
                    :key="getOperatorTypeRef(leftOpe) + getOperatorTypeRef(operator)"
                    :fromId="getDestTableRef(leftOpe.destTableName)"
                    :toId="getDestTableRef(operator.destTableName)"
                  ></ArrowConnector>
                </template>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getDestTableRef(operator.destTableName)"
                  :key="getDestTableRef(operator.destTableName)"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-else>
                <template v-for="leftOpe in operator.getLeftOperators()">
                  <ArrowConnector
                    :key="getOperatorTypeRef(leftOpe) + getOperatorTypeRef(operator)"
                    :fromId="getDestTableRef(leftOpe.destTableName)"
                    :toId="getOperatorTypeRef(operator)"
                  ></ArrowConnector>
                </template>
                <OperatorType
                  @click="e => showOperatorContextMenu(operator, e)"
                  :key="getOperatorTypeRef(operator)"
                  :id="getOperatorTypeRef(operator)"
                  :operator="operator"
                  draggable
                >
                </OperatorType>
                <ArrowConnector
                  :key="getOperatorTypeRef(operator) + getDestTableRef(operator.destTableName)"
                  :fromId="getOperatorTypeRef(operator)"
                  :toId="getDestTableRef(operator.destTableName)"
                ></ArrowConnector>
                <TableItem
                  v-if="!operator.isSendToGroupEmail"
                  @click="e => showSelectOperatorType(operator, e)"
                  :id="getDestTableRef(operator.destTableName)"
                  :key="getDestTableRef(operator.destTableName)"
                  :operator="operator"
                  :loading="isLoadingOperator(operator)"
                  draggable
                >
                </TableItem>
              </template>
              <template v-if="operator.persistConfiguration">
                <ArrowConnector
                  :key="'saved_connector' + getDestTableRef(operator.destTableName)"
                  :fromId="getDestTableRef(operator.destTableName)"
                  :toId="'saved' + getDestTableRef(operator.destTableName)"
                ></ArrowConnector>
                <SavedTable
                  @click="e => showSavedTableContextMenu(operator, e)"
                  :id="'saved' + getDestTableRef(operator.destTableName)"
                  :key="'saved' + getDestTableRef(operator.destTableName)"
                  :operator="operator"
                >
                </SavedTable>
              </template>
              <template v-if="operator.emailConfiguration">
                <ArrowConnector
                  :key="getEmailConnectorId(operator.emailConfiguration.subject)"
                  :fromId="getDestTableRef(operator.destTableName)"
                  :toId="getEmailConfigId(operator.emailConfiguration.subject)"
                ></ArrowConnector>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getEmailConfigId(operator.emailConfiguration.subject)"
                  :key="getEmailConfigId(operator.emailConfiguration.subject)"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-if="operator.thirdPartyPersistConfigurations">
                <template v-for="(thirdPartyConfig, index) in operator.thirdPartyPersistConfigurations">
                  <ArrowConnector
                    :key="'saved_connector' + thirdPartyConfig.getId() + index.toString()"
                    :fromId="getDestTableRef(operator.destTableName)"
                    :toId="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                  ></ArrowConnector>
                  <ThirdPartyPersistConfig
                    @click="e => showSavedThirdPartyConfigContextMenu(operator, thirdPartyConfig, index, e)"
                    :id="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                    :key="'saved_to_database' + thirdPartyConfig.getId() + index.toString()"
                    :operator="operator"
                    :third-party-config-index="index"
                    :third-party-config="thirdPartyConfig"
                  >
                  </ThirdPartyPersistConfig>
                </template>
              </template>
            </template>

            <!--              :ref="getDestTableRef(operator.destTableName)"-->

            <!--            <OperatorType-->
            <!--              @click="e => showOperatorContextMenu(operator, e)"-->
            <!--              :ref="getOperatorTypeRef(operator)"-->
            <!--              :data="operator"-->
            <!--              @move="repositionConnections"-->
            <!--            ></OperatorType>-->

            <template #controls>
              <!--              <button :disabled="!allOperators.length" @click.prevent="autoArrangement" class="btn btn-secondary mr-2 ml-auto">Auto Arrangement</button>-->
              <button :disabled="!allOperators.length" @click.prevent="clearAll" class="btn btn-secondary mr-2 ml-auto">Clear All</button>
              <button :disabled="!allOperators.length" @click.prevent="save" class="btn btn-primary">Save</button>
            </template>
          </DiagramPanel>
        </div>
      </div>
      <div v-if="allOperators.length > 0" class="etl-operator-container h-50 mb-0">
        <div class="etl-preview-header">
          <vuescroll>
            <div class="d-flex align-items-center">
              <template v-for="(operator, idx) in allOperators">
                <template v-if="!operator.isSendToGroupEmail">
                  <span v-if="idx > 0" :key="'sep' + idx" class="mx-2 text-muted">|</span>
                  <a
                    :title="operator.destDatabaseDisplayName + '.' + operator.destTableDisplayName"
                    class="preview-header-item"
                    @click.prevent="selectPreviewOperator(operator)"
                    :class="{ 'font-weight-bold': previewEtl === operator, 'text-truncate': idx !== allOperators.length - 1 }"
                    :key="idx"
                    href="#"
                  >
                    {{ getPreviewTableLabel(operator) }}
                    <!--                <i v-if="isLoadingOperator(operator)" class="fa fa-spin fa-spinner"></i>-->
                  </a>
                </template>
              </template>
            </div>
          </vuescroll>
        </div>
        <div class="etl-preview-content">
          <template v-if="previewEtlResponse && !previewEtlResponse.loading">
            <PreviewTableData
              v-if="previewEtlResponse.data"
              :tableSchema="previewEtlResponse.data.tableSchema"
              :disableEmptyChart="true"
              :retry="() => retryPreviewOperator(previewEtl)"
              class="h-100"
            ></PreviewTableData>
            <div v-else class="etl-preview-response">
              <vuescroll>
                <ErrorWidget @onRetry="retryPreviewOperator(previewEtl)" :error="previewEtlResponse.error.message"></ErrorWidget>
                <!--                <p class="text-center text-danger mb-2">-->
                <!--                  <strong>Error:</strong>-->
                <!--                  {{ previewEtlResponse.error.message }}-->
                <!--                </p>-->
                <!--                <div class="text-center">-->
                <!--                  <button @click.prevent="retryPreviewOperator(previewEtl)" class="btn btn-sm btn-primary">Retry</button>-->
                <!--                </div>-->
              </vuescroll>
            </div>
          </template>
          <div v-else class="h-100">
            <LoadingComponent></LoadingComponent>
          </div>
        </div>
      </div>
    </template>
    <JoinTable ref="joinTable"></JoinTable>
    <QueryTable ref="queryTable"></QueryTable>
    <PivotTable ref="pivotTable"></PivotTable>
    <TransformTable ref="transformTable"></TransformTable>
    <ManageFields ref="manageFields"></ManageFields>
    <SaveEtl ref="saveEtl" @saved="handleSaveEtl"></SaveEtl>
    <SelectSourcePopover ref="selectSourcePopover" @selectTable="onSelectSource" class="position-absolute"></SelectSourcePopover>
    <OperatorContextMenu @edit="handleEditOperator" @remove="handleRemoveOperator" ref="operatorContextMenu" class="position-absolute"></OperatorContextMenu>
    <TableContextMenu
      @select="handleTableContextMenu"
      @remove="handleRemoveOperator"
      @rename="handleRenameOperator"
      @saveToDataWareHouse="handleSaveToDataWareHouse"
      @saveToDatabase="handleSaveToDatabase"
      @sendToEmail="handleNewSaveToEmail"
      ref="tableContextMenu"
      class="position-absolute"
    ></TableContextMenu>
    <SavedTableContextMenu
      ref="savedTableContextMenu"
      @edit="handleSaveToDataWareHouse"
      @remove="removeSaveToDataWareHouse"
      class="position-absolute"
    ></SavedTableContextMenu>
    <SavedEmailConfigContextMenu
      ref="savedEmailConfigContextMenu"
      @edit="handleEditSaveToEmail"
      @remove="handleRemoveSendToEmail"
      class="position-absolute"
    ></SavedEmailConfigContextMenu>
    <SavedPartyConfigContextMenu
      ref="savedPartyConfigContextMenu"
      @edit="handleSaveToDatabase"
      @remove="removeThirdPartyPersistConfig"
      class="position-absolute"
    ></SavedPartyConfigContextMenu>
    <SaveToDataWareHouse ref="saveToDataWareHouse"></SaveToDataWareHouse>
    <SaveToDatabase ref="saveToDatabase"></SaveToDatabase>
    <SendToEmail ref="sendToEmail" />
    <DiRenameModal ref="renameModal" title="Edit Display Name"></DiRenameModal>
  </div>
</template>
<script lang="ts" src="./ManageEtlOperator.ts"></script>
<style lang="scss" scoped>
.etl-operator-container {
  //height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  border-radius: 4px;
  background-color: var(--panel-background-color);
  padding: 16px;
  margin-bottom: 16px;

  .cdp-body-content-block-nodata {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &-icon {
      font-size: 60px;
      margin-bottom: 16px;
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    &-msg {
      font-size: 16px;
    }
  }

  .etl-operator-body {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .etl-operator-controls {
    //padding: 15px;
    text-align: right;
  }

  .etl-column-container {
    display: flex;
    flex-wrap: nowrap;
    min-width: 100vw;
    min-height: 100vh;
  }

  .etl-column {
    display: inline-flex;
    flex-direction: column;
    max-width: 300px;
    width: 30%;
  }

  ::v-deep .ope-relationship-line {
    transform: translate(var(--ll-translate-x), var(--ll-translate-y));
    z-index: 2;
  }

  ::v-deep .etl-operator {
    display: flex;
    align-items: center;
    margin: 30px 0;
    height: 70px;
    //justify-content: flex-end;
  }

  ::v-deep .etl-list-table {
    display: flex;
    flex-direction: column;
  }

  ::v-deep .etl-table {
    display: inline-block;
    background-color: var(--sencondary);
    min-width: 130px;
    border-radius: 4px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
    position: absolute;
    cursor: move;
    margin: 10px 20px;
    display: flex;
    flex-direction: column;
    z-index: 3;

    $table-mw: 300px;

    &-title {
      background-color: var(--tooltip-background-color);
      padding: 8px 12px;
      border-radius: 4px 4px 0 0;
      border: 1px solid var(--tooltip-background-color);
      border-bottom: 0;
      display: inline-block;
      white-space: nowrap;
      max-width: $table-mw;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-body {
      background-color: var(--secondary);
      padding: 8px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      border: 1px solid transparent;
      border-top: 0;
      border-radius: 0 0 4px 4px;
      max-width: $table-mw;

      .etl-table-name {
        display: inline-block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &-action {
      display: flex;
      position: absolute;
      width: 100px;
      left: calc(100% - 8px);
      top: calc(50% - 8px);
      z-index: 3;

      &-button {
        border: none;
        outline: none;
        padding: 0;
        margin: 0;
        display: flex;
        width: 17px;
        height: 17px;
        align-items: center;
        justify-content: center;
        color: var(--secondary);
        background-color: var(--accent);
        border-radius: 50%;
        font-size: 9px;
        text-decoration: none;
      }
    }

    .etl-icon {
      margin-right: 8px;
    }

    &:hover {
      z-index: 4;
      .etl-table {
        &-title,
        &-body {
          border-color: var(--accent);
        }

        //&-action {
        //  display: flex;
        //}
      }
    }

    &.etl-highlight {
      .etl-table {
        &-title,
        &-body {
          border-color: var(--accent);
          animation: flash_border linear infinite 1000ms;
        }
      }

      @keyframes flash_border {
        0% {
          border-color: var(--accent);
        }
        25% {
          border-color: transparent;
        }
        50% {
          border-color: var(--accent);
        }
        75% {
          border-color: transparent;
        }
      }
    }
  }
}

.etl-preview-header {
  display: flex;
  width: 100%;
  position: sticky;
  z-index: 1;
  background: var(--secondary);
  top: 0;
  white-space: nowrap;
  height: 30px;
  .preview-header-item {
    max-width: 250px;
  }
}

.etl-preview-content {
  width: 100%;
  height: calc(100% - 30px);
}

.etl-preview-response {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  justify-content: center;
  //background-color: var(--active-color);
  padding: 15px;
}
</style>
