<template>
  <div class="config-area">
    <VisualizationItemListing
      v-if="showHeader"
      :itemSelected="itemSelected"
      :items="vizItemsFiltered"
      class="type-listing"
      @onItemDragging="handleItemDragging"
      @update:itemSelected="handleItemSelectedChanged"
    />
    <vuescroll :class="{ 'hide-header': !showHeader }" :ops="scrollOptions" class="droppable-listing">
      <div class="drop-area-listing">
        <template v-if="showConfig">
          <ConfigDraggable
            v-for="config in draggableConfigs"
            :key="buildKey(config.key)"
            :config="config"
            :hasDragging="hasDragging"
            :isShowSorting="false"
            @onConfigChange="handleConfigChange"
            @onItemDragging="handleItemDragging"
          />
        </template>
        <ConfigDraggable
          v-if="isShowSorting"
          :config="sortingConfig"
          :hasDragging="hasDragging"
          @onConfigChange="handleConfigChange"
          @onItemDragging="handleItemDragging"
        />
        <FilterDraggable
          v-if="isShowFilter"
          :draggableConfig="filterConfig"
          :hasDragging="hasDragging"
          :showChartControlConfig="showChartControlConfig"
          @onConfigChange="handleConfigChange"
          @onItemDragging="handleItemDragging"
        />
      </div>
    </vuescroll>
  </div>
</template>
<script lang="ts" src="./ConfigBuilder.ts" />
<style lang="scss" scoped>
.config-area {
  //overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 16px;

  .type-listing {
    padding-top: 16px;
    position: relative;
  }

  .type-listing + .droppable-listing {
    margin-top: 16px;
  }

  .droppable-listing {
    flex: 1;
    margin-bottom: 16px;

    &.hide-header {
      margin-top: 16px;
    }

    ::v-deep.__bar-is-vertical {
      left: 4px !important;
    }

    .drop-area-listing {
      //margin-bottom: 20px;

      > div + div {
        margin-top: 16px;
      }
    }
  }
}
</style>
