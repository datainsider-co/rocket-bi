<template>
  <Split :gutterSize="16" class="d-flex">
    <SplitArea :size="panelSize[0]" :minSize="0">
      <DatabaseTreeView class="left-panel" :schemas="databaseSchemas" :loading="loadingDatabaseSchemas" show-columns @reload="handleReloadDatabases">
        <template slot="table-item" slot-scope="{ database, table, toggleTable, isExpandedTable }">
          <div @dragend="onDragEnd" @dragstart="e => onDragStart(e, database, table)" @dragleave="onDragLeave" draggable="true" class="table-item">
            <a @click.prevent.stop="toggleTable(database, table)" href="#" class="px-1 mr-2">
              <i class="table-icon fa fa-caret-right text-muted mr-0" :class="{ 'fa-rotate-90': isExpandedTable(database, table) }"></i>
            </a>
            <span v-if="table.displayName">{{ table.displayName }}</span>
            <em v-else class="text-muted">{{ table.name }}</em>
          </div>
        </template>
      </DatabaseTreeView>
    </SplitArea>
    <SplitArea :size="panelSize[1]" :minSize="0">
      <div class="right-panel d-flex flex-column layout-content-panel p-3">
        <RelationshipEditor :mode="relationshipMode" :handler="globalRelationshipHandler"></RelationshipEditor>
      </div>
    </SplitArea>
  </Split>
</template>
<script src="./DataRelationship.ts" lang="ts"></script>
<style src="./DataRelationship.scss" lang="scss"></style>
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
