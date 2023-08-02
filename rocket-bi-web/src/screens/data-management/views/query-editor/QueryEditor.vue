<template>
  <Split :gutterSize="24" class="d-flex" @onDragEnd="resizeChart">
    <SplitArea :size="panelSize[0]" :minSize="0">
      <DatabaseTreeView
        ref="databaseTree"
        :mode="DatabaseTreeViewMode.QueryMode"
        :loading="isDatabaseLoading"
        :schemas="databaseSchemas"
        class="left-panel"
        show-columns
        @toggleDatabase="onToggleDatabase"
        @clickTable="handleClickTable"
        @clickField="handleClickField"
        @reload="handleReloadDatabases"
      ></DatabaseTreeView>
    </SplitArea>
    <SplitArea :size="panelSize[1]" :minSize="0">
      <div class="right-panel d-flex flex-column data-schema overflow-auto layout-content-panel">
        <LayoutNoData v-if="isDatabaseLoading || loading" icon="di-icon-query-editor">
          LOADING DATA...
        </LayoutNoData>
        <QueryComponent
          v-else
          ref="queryComponent"
          :showSaveQueryButton="true"
          :default-query="currentQuery"
          :formula-controller="formulaController"
          :editorController="editorController"
          :mode="mode"
          :tempQuery="tempQuery"
          :isReadOnly="isReadOnly"
          :is-enable-download-csv="isEnableDownloadCsv"
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
    <DiRenameModal ref="createAnalysisModal" title="Create Analysis" action-name="Create" label="Analysis name" placeholder="Type analysis name" />
    <MyDataPickFile ref="filePicker" />
    <MyDataPickDirectory ref="directoryPicker" @selectDirectory="handleSelectDirectory" />
    <PasswordModal ref="passwordModal" />
  </Split>
</template>
<script lang="ts" src="./QueryEditor.ts"></script>
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
