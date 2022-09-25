<template>
  <div class="dropdown-menu operator-context-menu">
    <template v-if="isDefaultMode">
      <template v-for="operator in operators">
        <button :disabled="isLoadingPreview" @click.prevent="selectType(operator)" :key="operator" class="dropdown-item">
          {{ OPERATOR_NAME[operator] }}
        </button>
      </template>
      <button :disabled="isLoadingPreview" @click.prevent="saveToDatabase" class="dropdown-item">Save To Database</button>
      <button :disabled="isLoadingPreview" @click.prevent="saveToDataWareHouse" class="dropdown-item">Save To Data Warehouse</button>
      <button :disabled="isLoadingPreview" @click.prevent="sendToEmail" class="dropdown-item">Send To Email</button>
      <button v-if="canRename" @click.prevent="renameOperator" class="dropdown-item">Edit Display Name</button>
      <button @click.prevent="removeOperator" class="dropdown-item">Remove</button>
      <slot></slot>
    </template>
    <template v-else-if="isSelectTableMode">
      <div class="operator-context-menu-header">
        <a @click.prevent="reset" href="#">
          <i class="di-icon-arrow-left"></i>
          Select Table to Join
        </a>
      </div>
      <SelectSource ref="selectSource" @selectTable="onSelectTable" @selectOperator="onSelectOperator" hide-header inject-operators></SelectSource>
    </template>
    <template v-else>
      <p class="text-danger">Not support viewMode = {{ viewMode }}!</p>
    </template>
  </div>
</template>
<script lang="ts">
import { Component, Inject, Vue } from 'vue-property-decorator';
import { ETL_OPERATOR_TYPE, ETL_OPERATOR_TYPE_NAME, EtlOperator } from '@core/DataCook';
import SelectSource from '../SelectSource/SelectSource.vue';
import { DatabaseSchema, TableSchema } from '@core/domain';
import ContextMenuMixin from './ContextMenu.mixin';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

enum VIEW_MODE {
  Default = 'Default',
  SelectTable = 'SelectTable'
}

@Component({
  components: {
    SelectSource
  }
  // mixins: [ContextMenuMixin]
})
export default class TableContextMenu extends ContextMenuMixin {
  private viewMode = VIEW_MODE.Default;
  private operator: EtlOperator | null = null;
  private table: TableSchema | null = null;

  @Inject('isLoadingOperator')
  private readonly isLoadingOperatorInjector!: (operator: EtlOperator) => boolean;

  private get isLoadingPreview() {
    if (this.isLoadingOperatorInjector && this.operator) {
      return this.isLoadingOperatorInjector(this.operator);
    }
    return true;
  }

  private get operators() {
    return [
      ETL_OPERATOR_TYPE.JoinOperator,
      ETL_OPERATOR_TYPE.ManageFieldOperator,
      ETL_OPERATOR_TYPE.SQLQueryOperator,
      ETL_OPERATOR_TYPE.PivotTableOperator,
      ETL_OPERATOR_TYPE.TransformOperator
    ];
  }

  private get OPERATOR_NAME() {
    return ETL_OPERATOR_TYPE_NAME;
  }

  get isDefaultMode() {
    return this.viewMode === VIEW_MODE.Default;
  }

  get isSelectTableMode() {
    return this.viewMode === VIEW_MODE.SelectTable;
  }

  get canRename() {
    return this.operator && !this.operator.isGetData;
  }

  private reset() {
    this.viewMode = VIEW_MODE.Default;
  }

  showPopover(operator: EtlOperator, top: number, left: number) {
    this.operator = operator;
    this.reset();
    this.show(top, left);
  }

  hidePopover() {
    this.hide();
  }

  private selectType(operatorType: ETL_OPERATOR_TYPE) {
    if (operatorType === ETL_OPERATOR_TYPE.JoinOperator) {
      this.viewMode = VIEW_MODE.SelectTable;
      // this.$nextTick(() => {
      //   if (this.$refs.selectSource) {
      //     this.$refs.selectSource.focus();
      //   }
      // });
      TrackingUtils.track(TrackEvents.ETLJoinTable, { database_name: this.operator?.destTableName, table_name: this.operator?.destTableName });
    } else {
      this.$emit('select', this.operator, operatorType);
      this.hidePopover();
    }
  }

  private onSelectTable(database: DatabaseSchema, table: TableSchema) {
    this.$emit('select', this.operator, ETL_OPERATOR_TYPE.JoinOperator, { database, table });
    this.hidePopover();
  }

  private onSelectOperator(operator: EtlOperator) {
    this.$emit('select', this.operator, ETL_OPERATOR_TYPE.JoinOperator, { operator });
    this.hidePopover();
  }

  private removeOperator() {
    this.$emit('remove', this.operator);
    this.hidePopover();
  }

  private renameOperator() {
    this.$emit('rename', this.operator);
    this.hidePopover();
  }

  private saveToDataWareHouse() {
    this.$emit('saveToDataWareHouse', this.operator);
    this.hidePopover();
  }

  private sendToEmail() {
    this.$emit('sendToEmail', this.operator);
    this.hidePopover();
  }

  private saveToDatabase() {
    this.$emit('saveToDatabase', this.operator);
    this.hidePopover();
  }
}
</script>
<style lang="scss" scoped>
.operator-context-menu {
  position: fixed !important;
  overflow: hidden;
  background-color: var(--secondary);

  &-header {
    padding: 16px 16px 0;

    a {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 500;
    }
  }

  .dropdown-item:disabled {
    opacity: 0.6;
    cursor: not-allowed !important;
  }
}
</style>
