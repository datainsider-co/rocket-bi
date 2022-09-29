<template>
  <div v-b-hover="handleHover" class="w-100 h-100 position-relative" :style="{ backgroundColor: backgroundColor }">
    <StatusWidget :class="chartWidgetClass" :error="errorMessage" :renderWhen="renderWhen" :status="status" @retry="retryLoadData">
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
              @hook:mounted="handleOnRendered"
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
    <div class="widget-action d-flex flex-column">
      <div class="d-flex flex-row mt-2">
        <InnerFilter
          class="mr-2"
          v-if="currentChartInfo.containChartFilter && !isPreview"
          :meta-data="currentChartInfo"
          :id="`${currentChartInfo.id}-chart-filter`"
          @onFilterSelect="handleChartFilterSelect"
          @onDelete="handleDeleteChartFilter"
        />
        <template>
          <template v-if="isFullSizeMode">
            <ActionWidgetFilter
              v-if="hasFilter()"
              :id="genBtnId('filter-full-mode', currentChartInfo.id)"
              :filter-requests="getFilterRequests()"
              :is-apply-filter="isAffectByFilter()"
            />
            <ActionWidgetMore
              v-if="enableMoreAction"
              :id="genBtnId('more-action-full-mode', currentChartInfo.id)"
              :dashboardMode="dashboardMode"
              :drilldownId="genBtnId('drilldown-full-mode', currentChartInfo.id)"
              :meta-data="currentChartInfo"
              :zoomId="genBtnId('zoom-full-mode', currentChartInfo.id)"
            />
            <!--          <img-->
            <!--            :id="genBtnId('hide-full-mode', currentChartInfo.id)"-->
            <!--            alt="Minimize Screen"-->
            <!--            class="icon-title di-popup ic-40 cursor-pointer btn-ghost"-->
            <!--            src="@/assets/icon/ic_minimize.svg"-->
            <!--            @click="hideFullSize"-->
            <!--          />-->
          </template>
          <template v-else>
            <ActionWidgetFilter
              v-if="hasFilter()"
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
            <!--          <img-->
            <!--            v-if="canShowFullScreen"-->
            <!--            :id="genBtnId('hide', currentChartInfo.id)"-->
            <!--            alt="Full Screen"-->
            <!--            class="icon-title di-popup ic-40 cursor-pointer btn-ghost"-->
            <!--            src="@/assets/icon/ic-full-screen.svg"-->
            <!--            @click="showFullSize"-->
            <!--          />-->
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ChartHolder.ts"></script>

<style lang="scss" src="./ChartHolder.scss" scoped></style>
