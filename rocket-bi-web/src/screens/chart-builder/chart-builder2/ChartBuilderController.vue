<template>
  <div builder-default-style id="builder-controller">
    <div class="data-builder-container">
      <div class="data-builder-bar">
        <div class="data-builder-bar--menu">
          <div :class="{ active: isSettingConfig }" class="data-builder-bar--menu--item" @click="updateBuilderConfig(true)">
            <i class="di-icon-config"></i>
            Builder
          </div>
          <div :class="{ active: !isSettingConfig }" class="data-builder-bar--menu--item" @click="updateBuilderConfig(false)">
            <i class="di-icon-tool"></i>
            Settings
          </div>
        </div>
      </div>
      <div class="data-builder">
        <div class="d-flex flex-row data-builder-header">
          <h3 class="cursor-default unselectable">
            Chart Builder
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
          <div class="builder-config-container">
            <div class="builder-config" v-show="isSettingConfig">
              <DatabaseListing
                :isDragging.sync="isDragging"
                :status="databaseStatus"
                :error="databaseErrorMsg"
                :hideRetry="true"
                :showSelectDatabase="config.databaseConfig.showSelectDatabase"
                :showSelectTabControl="config.databaseConfig.useTabControl"
                :hideTableAction="config.databaseConfig.hideTableAction"
                class="database-panel"
                ref="databasePanel"
                @updateTable="handleTableUpdated"
                @updateStatus="updateDatabaseStatus"
                @dragStart="onDragStart"
                @dragEnd="onDragEnd"
              ></DatabaseListing>
              <div class="config-chart-panel">
                <div class="config-filter-area">
                  <ConfigBuilder
                    ref="configBuilder"
                    :showHeader="config.builderConfig.showVizListing"
                    :showSorting="config.builderConfig.showSortConfig"
                    :showConfig="config.builderConfig.showGeneralConfig"
                    :showFilter="config.builderConfig.showFilterConfig"
                    :showChartControlConfig="config.builderConfig.showChartControlConfig"
                    :visualizationItems="visualizationItems"
                    :isDragging="isDragging"
                    :draggingType="draggingType"
                    class="col-12 config-panel"
                    @onQuerySettingChanged="onQuerySettingChanged"
                  />
                </div>
              </div>
            </div>
            <div v-show="!isSettingConfig" class="setting-panel">
              <StatusWidget :status="databaseStatus" class="chart-setting-status">
                <vuescroll :ops="scrollOptions" class="chart-setting-area" :key="currentCompoentKey">
                  <!-- Nếu không có setting phù hợp thì render default -->
                  <template v-if="toSettingComponent">
                    <component :is="toSettingComponent" :chartInfo="currentChartInfo" class="setting-component" @onChartInfoChanged="onChartInfoChanged" />
                  </template>
                  <template v-else>
                    <DefaultSetting />
                  </template>
                  <template #error>
                    <!-- Nếu không có response thì render setting/default -->
                    <template v-if="toSettingComponent">
                      <component :is="toSettingComponent" :chartInfo="currentChartInfo" class="setting-component" @onChartInfoChanged="onChartInfoChanged" />
                    </template>
                    <template v-else>
                      <DefaultSetting />
                    </template>
                  </template>
                </vuescroll>
              </StatusWidget>
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
    </div>

    <MatchingLocationModal ref="matchingLocationModal" :current-chart-info="currentChartInfo" @onApplyMatching="handleApplyMatching" />
    <!-- <VizSettingModal ref="settingModal"></VizSettingModal> -->
  </div>
</template>

<script lang="ts" src="./ChartBuilderController.ts"></script>
<style lang="scss" scoped src="./ChartBuilderController.scss"></style>

<style lang="scss">
body,
html,
#app {
  height: 100% !important;
}

.setting-component {
  > div:first-child {
    .panel-header-divider {
      height: 0;
    }
  }
}
</style>
