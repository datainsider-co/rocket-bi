<template>
  <Split :gutterSize="24" class="d-flex" @onDragEnd="resizeChart">
    <SplitArea :size="panelSize[0]" :minSize="0">
      <DatabaseTreeView
        ref="databaseTree"
        :mode="DatabaseTreeViewMode.QueryMode"
        :loading="loadingDatabaseSchemas"
        :schemas="databaseSchemas"
        class="left-panel"
        show-columns
        @clickTable="handleClickTable"
        @clickField="handleClickField"
        @reload="handleReloadDatabases"
      ></DatabaseTreeView>
    </SplitArea>
    <SplitArea :size="panelSize[1]" :minSize="0">
      <div class="right-panel d-flex flex-column data-schema overflow-auto layout-content-panel">
        <LayoutNoData v-if="loadingDatabaseSchemas" icon="di-icon-query-editor">
          LOADING DATA...
        </LayoutNoData>
        <QueryComponent
          v-else
          ref="queryComponent"
          :is-update-schema-mode="isUpdateSchemaMode"
          :showSaveQueryButton="true"
          :default-query="currentQuery"
          :formula-controller="formulaController"
          :editorController="editorController"
          :mode="mode"
          @onCreateTable="showCreateTableModal"
          @onUpdateTable="showUpdateTableModal"
          @onSaveAdhoc="showFilePickerModal"
          @onSaveQuery="handleSave"
          @onUpdateChart="handleUpdateChart"
          @onCreateChart="handleCreateChart"
        ></QueryComponent>
      </div>
      <TableCreationFromQueryModal ref="tableCreationModal" :query="currentQuery"></TableCreationFromQueryModal>
    </SplitArea>
    <DirectoryCreate ref="mdCreateDirectory" @onCreated="handleQueryCreated" />
    <MyDataPickFile ref="filePicker" @selectDirectory="handleSelectFile" />
    <MyDataPickDirectory ref="directoryPicker" @selectDirectory="handleSelectDirectory" />
  </Split>
</template>
<script lang="ts" src="./QueryEditor.ctrl.ts"></script>
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
