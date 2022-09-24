<template>
  <b-container :style="dashboardStyle" fluid="*">
    <DiGridstack ref="gridstack" :canInteractive="enableEdit" :options="defaultOptions">
      <template v-for="(position, id) in positions">
        <DiGridstackItem
          :id="+id"
          :key="id"
          :height="position.height"
          :width="position.width"
          :x="position.column"
          :y="position.row"
          :zIndex="position.zIndex"
          @change="handleChangePosition"
          @onClick="handleClickItem(id, position)"
        >
          <div :style="{ cursor: getCurrentCursor }" class="h-100 w-100">
            <TabViewer
              v-if="isTabWidget(getWidget(id))"
              :widget="getWidget(id)"
              :id="`${id}-tab-view`"
              :isShowEdit="isEditMode"
              @onChangePosition="handleChangePosition"
            />
            <WidgetContainer v-else :isShowEdit="isEditMode" :widget="getWidget(id)" :id="`${id}-chart-holder`" />
          </div>
        </DiGridstackItem>
      </template>
    </DiGridstack>
    <WidgetContextMenu ref="widgetContextMenu"></WidgetContextMenu>
  </b-container>
</template>

<script lang="ts" src="./Dashboard.ts" />
<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';

.widget-blur {
  background-color: $widgetColor;
  border-radius: 4px;
}

.dashboard {
  margin: -15px;
}

.ui-draggable-dragging {
  z-index: var(--next-max-z-index) !important;
}
</style>
