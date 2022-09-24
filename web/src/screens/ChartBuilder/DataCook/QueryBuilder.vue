<template>
  <div class="h-100 w-100 d-inline-block">
    <div class="data-builder">
      <div class="d-flex flex-row data-builder-body">
        <DatabaseListing
          :isDragging.sync="isDragging"
          :mode="DatabaseEditionMode.Query"
          :showSelectDatabase="false"
          class="col-2 database-panel"
          @clickField="handleClickField"
          @clickTable="handleClickTable"
        >
          <template #header>
            <div class="db-header">
              <label class="unselectable">Table & Field</label>
            </div>
          </template>
        </DatabaseListing>
        <div class="query-builder-body overflow-auto">
          <QueryComponent
            ref="queryComponent"
            :showAdHocAnalysis="false"
            :convertor="convertQuery"
            :editor-controller="editorController"
            :default-query="defaultQuery"
            :formula-controller="controller"
            :show-create-table-button="false"
            :is-query-on-first-time="true"
            :show-ad-hoc-analysis="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./QueryBuilder.ts"></script>
<style lang="scss" scoped src="./query-builder.scss"></style>

<style lang="scss">
body,
html,
#app {
  height: 100% !important;
}

.data-builder-body .query-builder-body {
  background: var(--secondary);
  border-radius: 4px;
  flex: 1;
  //padding: 16px;
}
</style>
