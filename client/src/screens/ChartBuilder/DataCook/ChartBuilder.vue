<template>
  <div class="h-100 w-100 d-inline-block">
    <div class="data-builder">
      <div class="d-flex flex-row data-builder-body">
        <DatabaseListing :isDragging.sync="isDragging" class="col-3 database-panel" :showSelectDatabase="false" :mode="DatabaseEditionMode.None">
          <template #header>
            <div class="db-header">
              <label class="unselectable">Table & Field</label>
            </div>
          </template>
        </DatabaseListing>
        <div class="col-4">
          <div class="config-filter-area h-100">
            <ConfigBuilder
              ref="configBuilder"
              :isDragging="isDragging"
              :showHeader="false"
              class="col-12 config-panel"
              @onQuerySettingChanged="onQuerySettingChanged"
            />
            <!--            <FilterPanel :isDragging="isDragging" class="col-12 filter-panel"></FilterPanel>-->
          </div>
        </div>
        <VizPanel ref="vizPanel" class="col-5 visualization-panel" :show-setting="false"></VizPanel>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ChartBuilder.ts"></script>
<style lang="scss" scoped src="./chart-builder.scss"></style>

<style lang="scss">
body,
html,
#app {
  height: 100% !important;
}
</style>
