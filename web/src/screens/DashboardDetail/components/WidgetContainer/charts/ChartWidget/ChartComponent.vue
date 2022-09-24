<template>
  <div class="w-100 h-100">
    <template v-if="isTableChart">
      <component
        :is="toTableComponent"
        ref="chart"
        :chartData="response"
        :isPreview="isPreview"
        :querySetting="metaData.setting"
        :tableChartTempId="metaData.id"
        :disableSort="disableSort"
        :disablePagination="disablePagination"
      />
    </template>
    <template v-else-if="toComponent">
      <div :key="genBtnId('chart', metaData.id)" class="h-100 w-100 onRow overflow-hidden">
        <div :class="componentClass">
          <component
            :is="toComponent"
            :id="metaData.id"
            ref="chart"
            :backgroundColor="setting.getBackgroundColor()"
            :data="response"
            :isPreview="isPreview"
            :query="metaData.setting"
            :current-query="getCurrentQuerySetting()"
            :setting="setting"
            :show-edit-component="showEditComponent"
            :subTitle="setting.getSubtitle()"
            :textColor="setting.getTextColor()"
            :title="setting.getTitle()"
            :chart-info="metaData"
            :disableSort="disableSort"
            :disablePagination="disablePagination"
          >
          </component>
        </div>
      </div>
    </template>
    <template v-else-if="!toComponent">
      <div>Chart unsupported</div>
    </template>
  </div>
</template>

<script lang="ts" src="./ChartComponentController.ts"></script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.onRow {
  display: flex;
  flex-wrap: wrap;
}

.chart-widget-container {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
}

.filter-widget-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
