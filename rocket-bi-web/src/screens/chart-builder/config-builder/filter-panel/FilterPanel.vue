<template>
  <div class="filter-area">
    <div class="drop-area-listing">
      <DiTab :tabs="itemSelected.extraPanels" key-for-display="title">
        <template #default="{ tab }">
          <div class="text-center drop-scroll-area">
            <vuescroll :ops="scrollOptions">
              <div class="mar-b-32">
                <FilterDraggable v-if="isFilter(tab)" :draggableConfig="tab" :hasDragging="isDragging" />
                <ConfigDraggable
                  v-else-if="isSorting(tab)"
                  :config="tab"
                  :showTitle="false"
                  :showHelpIcon="false"
                  :hasDragging="isDragging"
                  :showSortingConfig="true"
                />
              </div>
            </vuescroll>
          </div>
        </template>
      </DiTab>
    </div>
  </div>
</template>

<script lang="ts" src="./FilterPanel.ts"></script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.filter-area {
  padding: 16px;

  .drop-area-listing {
    height: 100%;

    > div + div {
      margin-top: 16px;
    }

    .drop-scroll-area {
      height: 100%;
    }
  }
}
</style>
