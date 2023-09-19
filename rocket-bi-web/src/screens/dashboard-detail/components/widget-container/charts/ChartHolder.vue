<template>
  <WidgetContainer :widget="currentChartInfo" :default-setting="widgetSetting" :isHideShadow="isHideShadow" class="chart-holder-component">
    <StatusWidget :error="errorMessage" :status="status" @retry="retryLoadData" class="chart-holder-component--status">
      <template #default>
        <template v-if="hasData">
          <CaptureException name="chart" @onError="handleChartRenderError">
            <ChartComponent
              :id="currentChartInfo.id"
              :key="currentChartInfo.id"
              ref="chartComponent"
              :meta-data="currentChartInfo"
              :response="response"
              :is-preview="isPreview"
              :show-edit-component="showEditComponent"
              :disableSort="disableSort"
              :disablePagination="disablePagination"
            >
            </ChartComponent>
          </CaptureException>
        </template>
        <template v-else>
          <EmptyWidget :key="`testing-${currentChartInfo.id}`">
            {{ emptyMessage }}
          </EmptyWidget>
        </template>
      </template>
    </StatusWidget>
    <template #action-bar>
      <InnerFilter
        class="mar-r-4"
        v-if="currentChartInfo.hasInnerFilter && !isPreview"
        :meta-data="currentChartInfo"
        :id="`${currentChartInfo.id}-chart-filter`"
        @onFilterSelect="handleChartFilterSelect"
        @onDelete="handleDeleteChartFilter"
      />
      <ActionWidgetFilter
        v-if="hasFilter()"
        class="mar-r-4"
        :id="genBtnId('filter', currentChartInfo.id)"
        :filter-requests="getFilterRequests()"
        :is-apply-filter="isAffectByFilter()"
      />
      <ActionWidgetMore
        v-if="enableMoreAction"
        :id="genBtnId('more-action', currentChartInfo.id)"
        :dashboardMode="dashboardMode"
        :drilldownId="genBtnId('drilldown', currentChartInfo.id)"
        :meta-data="currentChartInfo"
        :zoomId="genBtnId('zoom', currentChartInfo.id)"
      />
      <slot name="action-bar"></slot>
    </template>
  </WidgetContainer>
</template>

<script lang="ts" src="./ChartHolder.ts"></script>

<style lang="scss">
.chart-holder-component {
  &--status {
    position: unset;
  }
}
</style>
