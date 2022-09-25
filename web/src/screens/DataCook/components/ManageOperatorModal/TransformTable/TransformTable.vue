<template>
  <EtlModal @submit="submit" @hidden="resetModel" ref="modal" :actionName="actionName" :width="1680" :title="title" class="modal-operator">
    <ChartBuilder
      v-if="model"
      ref="chartBuilder"
      :tableSchema="tableSchema"
      :defaultChartType="chartType"
      :query-setting="querySetting"
      :extra-data="extraData"
      class="text-center"
    ></ChartBuilder>
  </EtlModal>
</template>
<script lang="ts" src="./TransformTable.ctrl.ts"></script>
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
      max-height: calc(100vh - 140px);
    }
  }
}
</style>
