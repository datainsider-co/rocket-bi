<template>
  <EtlModal @submit="submit" @hidden="resetModel" ref="modal" :actionName="actionName" :width="1680" :title="title">
    <ChartBuilder
      v-if="model"
      ref="chartBuilder"
      :tableSchema="tableSchema"
      :defaultChartType="chartType"
      :query-setting="querySetting"
      :extraData="extraData"
      class="text-center"
    ></ChartBuilder>
  </EtlModal>
</template>
<script lang="ts" src="./PivotTable.ts"></script>
<style lang="scss" scoped>
.modal-operator {
  ::v-deep .data-builder-body {
    min-width: 0;
    padding: 0;
    height: calc(90vh - 48px);

    .config-filter-area,
    .database-panel,
    .visualization-panel {
      background-color: var(--secondary);
      border-radius: 4px;
    }

    //.database-listing {
    //  margin-right: 10px;
    //}
    //.visualization-panel {
    //  margin-left: 10px;
    //}

    //& > .data-builder-body {
    //  width: 100%;
    //  $width: 223px;
    //  .database-panel {
    //    background-color: var(--secondary);
    //    flex: none;
    //    width: 223px;
    //  }
    //  .query-builder-body {
    //    width: calc(100% - #{$width});
    //  }
    //}
  }
}
</style>
