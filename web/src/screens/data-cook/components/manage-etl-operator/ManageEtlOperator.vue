<template>
  <div>
    <div v-if="loading" class="etl-operator-container h-100">
      <div class="etl-operator-container--loading">
        <LoadingComponent></LoadingComponent>
      </div>
    </div>
    <template v-else>
      <div ref="bodyContainer" class="etl-operator-container" :class="[operatorHandler.allOperators.length > 0 ? 'h-50' : 'h-100 mb-0']">
        <div v-if="operatorHandler.getDataItems.length <= 0" class="cdp-body-content-block-nodata">
          <i class="cdp-body-content-block-nodata-icon di-icon-etl"></i>
          <div class="cdp-body-content-block-nodata-msg text-center">
            The first click
            <a @click.prevent="showSelectSourcePopover" href="#" class="font-weight-bold">Add Source</a>
          </div>
        </div>
        <div v-else class="etl-operator-body">
          <DiagramPanel ref="diagramPanel" :position="model.stagePosition">
            <!--              :ref="getTableRef(operator.tableSchema.dbName, operator.tableSchema.name)"-->

            <template v-for="(operator, index) in operatorHandler.getDataItems">
              <TableItem
                ref="sourceTableItems"
                @click="e => showGetOperatorMenu(operator, e)"
                :id="getOperatorId(operator)"
                :key="getOperatorId(operator)"
                :operator="operator"
                :loading="isLoadingOperator(operator)"
                :is-error="isError(operator)"
                draggable
              >
              </TableItem>
              <template v-if="operator.persistConfiguration">
                <ArrowConnector
                  :key="getOperatorId(operator, `persist_arrow_${index}`)"
                  :fromId="getOperatorId(operator)"
                  :toId="getOperatorId(operator, 'persist')"
                  :is-error="isError(operator)"
                ></ArrowConnector>
                <SavedTable
                  @click="e => showSavedTableContextMenu(operator, e)"
                  :id="getOperatorId(operator, 'persist')"
                  :key="getOperatorId(operator, `persist_${index}`)"
                  :operator="operator"
                >
                </SavedTable>
              </template>
              <template v-if="operator.emailConfiguration">
                <ArrowConnector
                  :key="getOperatorId(operator, `email_arrow_${index}`)"
                  :fromId="getOperatorId(operator)"
                  :toId="getOperatorId(operator, 'email')"
                  :is-error="isError(operator)"
                ></ArrowConnector>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getOperatorId(operator, 'email')"
                  :key="getOperatorId(operator, `email_${index}`)"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-if="operator.thirdPartyPersistConfigurations">
                <template v-for="(thirdPartyConfig, index) in operator.thirdPartyPersistConfigurations">
                  <ArrowConnector
                    :key="getOperatorId(operator, `third_party_arrow_${index}`)"
                    :fromId="getOperatorId(operator)"
                    :toId="getOperatorId(operator, `third_party_${index}`)"
                    :is-error="isError(operator)"
                  ></ArrowConnector>
                  <ThirdPartyPersistConfig
                    @click="e => showSavedThirdPartyConfigContextMenu(operator, thirdPartyConfig, index, e)"
                    :id="getOperatorId(operator, `third_party_${index}`)"
                    :key="getOperatorId(operator, `third_party_${index}`)"
                    :operator="operator"
                    :third-party-config-index="index"
                    :third-party-config="thirdPartyConfig"
                  >
                  </ThirdPartyPersistConfig>
                </template>
              </template>
            </template>

            <template v-for="(operator, childIndex) in operatorHandler.notGetDataItems">
              <template v-if="operator.isSendToGroupEmail">
                <template v-for="parentOperator in operator.getParentOperators()">
                  <ArrowConnector
                    :key="getOperatorId(parentOperator, 'group_email_arrow')"
                    :fromId="getOperatorId(parentOperator)"
                    :toId="getOperatorId(operator, 'group_email')"
                    :is-error="isError(parentOperator)"
                  ></ArrowConnector>
                </template>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getOperatorId(operator, 'group_email')"
                  :key="getOperatorId(operator, 'group_email')"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-else>
                <template v-for="(parentOperator, parentIndex) in operator.getParentOperators()">
                  <ArrowConnector
                    :key="getOperatorId(parentOperator, String(parentIndex)) + '_to_' + getOperatorId(operator, String(childIndex))"
                    :fromId="getOperatorId(parentOperator)"
                    :toId="getOperatorId(operator, 'type')"
                    :is-error="isError(parentOperator)"
                  ></ArrowConnector>
                </template>
                <OperatorType
                  @click="e => showNotGetOperatorMenu(operator, e)"
                  :key="getOperatorId(operator, 'type')"
                  :id="getOperatorId(operator, 'type')"
                  :operator="operator"
                  :isError="isError(operator)"
                  draggable
                >
                </OperatorType>
                <ArrowConnector
                  :key="getOperatorId(operator, 'type_arrow_to')"
                  :fromId="getOperatorId(operator, 'type')"
                  :toId="getOperatorId(operator)"
                  :is-error="isError(operator)"
                ></ArrowConnector>
                <TableItem
                  v-if="!operator.isSendToGroupEmail"
                  @click="e => showGetOperatorMenu(operator, e)"
                  :id="getOperatorId(operator)"
                  :key="getOperatorId(operator)"
                  :operator="operator"
                  :loading="isLoadingOperator(operator)"
                  :is-error="isError(operator)"
                  draggable
                >
                </TableItem>
              </template>
              <template v-if="operator.persistConfiguration">
                <ArrowConnector
                  :key="getOperatorId(operator, 'persist_arrow')"
                  :fromId="getOperatorId(operator)"
                  :toId="getOperatorId(operator, 'persist')"
                  :is-error="isError(operator)"
                ></ArrowConnector>
                <SavedTable
                  @click="e => showSavedTableContextMenu(operator, e)"
                  :id="getOperatorId(operator, 'persist')"
                  :key="getOperatorId(operator, 'persist')"
                  :operator="operator"
                >
                </SavedTable>
              </template>
              <template v-if="operator.emailConfiguration">
                <ArrowConnector
                  :key="getOperatorId(operator, 'email_arrow')"
                  :fromId="getOperatorId(operator)"
                  :toId="getOperatorId(operator, 'email')"
                  :is-error="isError(operator)"
                ></ArrowConnector>
                <SavedEmailConfig
                  ref="savedEmailConfigs"
                  @click="e => showSavedEmailConfigContextMenu(operator, e)"
                  @dragmove="handleDragEmailConfig"
                  :id="getOperatorId(operator, 'email')"
                  :key="getOperatorId(operator, 'email')"
                  :operator="operator"
                >
                </SavedEmailConfig>
              </template>
              <template v-if="operator.thirdPartyPersistConfigurations">
                <template v-for="(thirdPartyConfig, index) in operator.thirdPartyPersistConfigurations">
                  <ArrowConnector
                    :key="getOperatorId(operator, `third_party_arrow_${index}`)"
                    :fromId="getOperatorId(operator)"
                    :toId="getOperatorId(operator, `third_party_${index}`)"
                  ></ArrowConnector>
                  <ThirdPartyPersistConfig
                    @click="e => showSavedThirdPartyConfigContextMenu(operator, thirdPartyConfig, index, e)"
                    :id="getOperatorId(operator, `third_party_${index}`)"
                    :key="getOperatorId(operator, `third_party_${index}`)"
                    :operator="operator"
                    :third-party-config-index="index"
                    :third-party-config="thirdPartyConfig"
                  >
                  </ThirdPartyPersistConfig>
                </template>
              </template>
            </template>
            <template #controls>
              <button :disabled="!operatorHandler.allOperators.length" @click.prevent="clearAll" class="btn btn-secondary mr-2 ml-auto">Clear All</button>
              <button :disabled="!operatorHandler.allOperators.length" @click.prevent="save" class="btn btn-primary">Save</button>
            </template>
          </DiagramPanel>
        </div>
      </div>
      <div v-if="operatorHandler.allOperators.length > 0" class="etl-operator-container h-50 mt-3 mb-0">
        <div class="etl-preview-header">
          <vuescroll>
            <div class="d-flex align-items-center">
              <template v-for="(operator, idx) in operatorHandler.allOperators">
                <template v-if="!operator.isSendToGroupEmail">
                  <span v-if="idx > 0" :key="'sep' + idx" class="mx-2 text-muted">|</span>
                  <a
                    :title="operator.destDatabaseDisplayName + '.' + operator.destTableDisplayName"
                    class="preview-header-item"
                    @click.prevent="selectOperator(operator, false)"
                    :class="{ 'font-weight-bold': selectedOperator === operator, 'text-truncate': idx !== operatorHandler.allOperators.length - 1 }"
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
              :retry="() => retryPreviewOperator(selectedOperator)"
              class="h-100"
            ></PreviewTableData>
            <div v-else class="etl-preview-response">
              <ErrorWidget
                @onRetry="retryPreviewOperator(selectedOperator)"
                :error="previewEtlResponse.error.message"
                is-show-all-error
                is-html-error
              ></ErrorWidget>
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
<style lang="scss">
.etl-operator-container {
  //height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  border-radius: 4px;
  background-color: var(--panel-background-color);
  padding: 16px;

  &--loading {
    display: flex;
    flex: 1;
    flex-direction: column;
    border-radius: 4px;
    background-color: var(--panel-background-color);
  }

  &:has(.etl-operator-container--loading) {
    padding: 0;
  }

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
  align-items: center;
}
</style>
