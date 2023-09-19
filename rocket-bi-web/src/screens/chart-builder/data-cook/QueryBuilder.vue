<template>
  <div class="h-100 w-100 d-inline-block">
    <div class="data-builder">
      <div class="d-flex flex-row data-builder-body">
        <DatabaseListing
          :isDragging.sync="isDragging"
          :mode="DatabaseListingMode.Query"
          :showSelectDatabase="true"
          class="col-2 database-panel"
          @clickField="handleClickField"
          @clickTable="handleClickTable"
        >
          <template #database-selector>
            <label class="database-listing-title text-left unselectable d-flex align-items-center">
              Table & Field
            </label>
          </template>
          <template #header-bar>
            <div class="mt-2"></div>
          </template>
        </DatabaseListing>
        <div class="query-builder-body overflow-auto">
          <QueryComponent
            ref="queryComponent"
            :showParameter="showParameter"
            :showAdHocAnalysis="false"
            :convertor="convertQuery"
            :editor-controller="editorController"
            :default-query="defaultQuery"
            :formula-controller="controller"
            :show-create-table-button="false"
            :is-query-on-first-time="true"
            :show-ad-hoc-analysis="false"
          >
            <!--            <template #header>-->
            <!--              <DiButtonGroup :buttons="queryLanguageOptions" ref="buttonGroup" />-->
            <!--            </template>-->
          </QueryComponent>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./QueryBuilder.ts"></script>
<style lang="scss" scoped src="./QueryBuilder.scss"></style>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

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

.data-builder-body .database-listing {
  .database-selector {
    justify-content: space-between;

    .database-listing-title {
      @include medium-text();
      font-weight: var(--builder-font-weight);
      margin: 0;
      height: 34px;
    }
  }
}
</style>
