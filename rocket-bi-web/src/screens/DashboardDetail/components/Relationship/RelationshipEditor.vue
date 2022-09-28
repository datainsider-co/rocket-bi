<template>
  <div class="data-relationship right-panel d-flex flex-column data-schema layout-content-panel" @dragenter.prevent @dragover.prevent @drop="onDrop">
    <StatusWidget :status="status" :error="errorMessage">
      <DiagramPanel ref="diagramPanel" :position="stagePosition">
        <div>
          <template v-for="(table, index) in addedTables">
            <TableSchemaItem
              ref="tableSchemaItems"
              :id="tableId(table.dbName, table.name)"
              :key="tableId(table.dbName, table.name)"
              :tableSchema="table"
              :position="getTablePosition(table.dbName, table.name, index)"
              :draggable="true"
              :relatedColumns="getRelatedColumns(table.dbName, table.name)"
              @showAction="handleShowTableActionMenu"
              @createConnector="handleCreateConnector"
              @draggingColumn="handleDraggingColumn"
              @endDraggingColumn="endDraggingColumn"
              @changePosition="handlePositionChanged"
            >
            </TableSchemaItem>
          </template>
          <template v-for="[key, value] in currentConnections">
            <CurvedConnector
              ref="curvedConnectors"
              :key="key"
              @showAction="handleShowConnectionActionMenu"
              :from-id="columnId(value.fromTable.dbName, value.fromTable.name, value.fromColumn.name)"
              :to-id="columnId(value.toTable.dbName, value.toTable.name, value.toColumn.name)"
            />
          </template>
          <CurvedConnector
            v-if="draggingConnector.fromId"
            ref="pointerConnector"
            isToPointer
            :from-id="draggingConnector.fromId"
            :to-id="draggingConnector.toId"
          />
        </div>
        <template v-if="isEditMode" #controls>
          <button :disabled="!canSave" @click.prevent="showDiscardChangesConfirmationModal" class="btn btn-secondary mr-2 ml-auto">Discard Changes</button>
          <button :disabled="!canSave" @click.prevent="save" class="btn btn-primary">Save</button>
        </template>
      </DiagramPanel>
      <TableActionContextMenu @hide="hideTable" @expand="expandTable" @remove="removeTable" ref="tableActionContextMenu"></TableActionContextMenu>
      <ConnectionActionContextMenu ref="connectionActionContextMenu" @remove="handleRemoveConnection"></ConnectionActionContextMenu>
    </StatusWidget>
  </div>
</template>
<script src="./RelationshipEditor.ctrl.ts" lang="ts"></script>
<style src="./RelationshipEditor.style.scss" lang="scss"></style>
<style lang="scss">
.left-panel,
.right-panel {
  width: 100% !important;
  min-width: unset !important;
  max-width: unset !important;
  min-height: 100%;
  height: 100%;
}

.data-relationship {
  display: flex;
  width: 100%;
  max-height: 100%;
  flex-direction: column;
  text-align: left;
  text-overflow: ellipsis;
  padding: 0 !important;
}

.layout-nodata {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;

  &-icon {
    font-size: 48px;
    margin-bottom: 16px;
    //color: var(--charcoal);
  }

  &-msg {
    font-size: 14px;
  }

  .diagram-panel {
    .diagram-panel-body {
      //
    }
  }
}
</style>
