<template>
  <div class="h-100 w-100 d-inline-block" builder-default-style>
    <div class="data-builder">
      <div class="d-flex flex-row data-builder-header">
        <h3 class="cursor-default unselectable">
          Visualization Builder
        </h3>
        <div class="ml-auto d-flex flex-row align-items-center btn-bar">
          <DiButton :id="genBtnId('data-builder-cancel')" border title="Cancel" @click="handleCancel" />
          <template v-if="isCreateMode">
            <DiButton :id="genBtnId('data-builder-add')" primary title="Add" @click="handleAddToDashboard" :disabled="isDisableAddOrUpdate" />
          </template>
          <template v-else>
            <DiButton :id="genBtnId('data-builder-update')" primary title="Save" @click="handleUpdateChart" :disabled="isDisableAddOrUpdate" />
          </template>
        </div>
      </div>
      <div class="d-flex flex-row data-builder-body">
        <DatabaseListing
          :isDragging.sync="isDragging"
          :status="databaseStatus"
          :error="databaseErrorMessage"
          :hideRetry="true"
          :showSelectDatabase="config.databaseConfig.showSelectDatabase"
          :showSelectTabControl="config.databaseConfig.useTabControl"
          class="database-panel"
          ref="databasePanel"
          @updateTable="handleTableUpdated"
          @updateStatus="updateDatabaseStatus"
        ></DatabaseListing>
        <div class="config-chart-panel">
          <div class="row config-filter-area">
            <ConfigBuilder
              ref="configBuilder"
              :showHeader="config.builderConfig.showVizListing"
              :showSorting="config.builderConfig.showSortConfig"
              :showConfig="config.builderConfig.showGeneralConfig"
              :showFilter="config.builderConfig.showFilterConfig"
              :visualizationItems="visualizationItems"
              :isDragging="isDragging"
              class="col-12 config-panel"
              @onQuerySettingChanged="onQuerySettingChanged"
            />
            <!--            <FilterPanel :isDragging="isDragging" class="col-12 filter-panel"></FilterPanel>-->
          </div>
        </div>
        <VizPanel
          ref="vizPanel"
          :show-setting="config.previewConfig.showSetting"
          class="visualization-panel"
          @clickSettingButton="onSettingButtonClicked"
          @clickMatchingButton="onMatchingButtonClicked"
        ></VizPanel>
      </div>
    </div>
    <MatchingLocationModal ref="matchingLocationModal" :current-chart-info="currentChartInfo" @onApplyMatching="handleApplyMatching" />
    <VizSettingModal ref="settingModal"></VizSettingModal>
  </div>
</template>

<script lang="ts" src="./ChartBuilderController.ts"></script>
<style lang="scss" scoped src="./data-builder.scss"></style>

<style lang="scss">
body,
html,
#app {
  height: 100% !important;
}
</style>
