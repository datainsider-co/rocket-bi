<template>
  <div class="di-dashboard" :style="dashboardStyle">
    <DiGridstack ref="gridstack" class="di-dashboard--gridstack" :canInteractive="allowEdit" :options="gridstackOptions">
      <template v-for="(position, id) in positions">
        <DiGridstackItem
          class="di-dashboard--gridstack--item"
          :id="+id"
          :key="id"
          :height="position.height"
          :width="position.width"
          :x="position.column"
          :y="position.row"
          :zIndex="position.zIndex"
          @change="onPositionChanged"
          @onClick="handleClickItem(id, position)"
        >
          <template>
            <FilterPanelViewer
              v-if="isFilterPanel(widgetAsMap[id])"
              :widget="widgetAsMap[id]"
              :id="`${id}-tab-view`"
              :isShowEdit="isEditMode"
              :widget-setting="widgetSetting"
              @onChangePosition="onPositionChanged"
            />
            <TabViewer
              v-else-if="isTabWidget(widgetAsMap[id])"
              :widget="widgetAsMap[id]"
              :id="`${id}-tab-view`"
              :isShowEdit="isEditMode"
              :widget-setting="widgetSetting"
              @onChangePosition="onPositionChanged"
            />
            <WidgetHolder v-else :isShowEdit="isEditMode" :widget="widgetAsMap[id]" :id="`${id}-chart-holder`" :widget-setting="widgetSetting" />
          </template>
        </DiGridstackItem>
      </template>
    </DiGridstack>
    <WidgetContextMenu ref="widgetContextMenu"></WidgetContextMenu>
  </div>
</template>

<script lang="ts" src="./Dashboard.ts" />

<style lang="scss">
.di-dashboard {
  &--gridstack {
    &--item {
    }
  }
}
</style>
