<template>
  <div class="item">
    <InternalFilterPanel
      ref="filterPanel"
      :id="filterId"
      :filter.sync="currentFilter"
      :isShowDisable="false"
      :maxChipShowing="3"
      :enableControlConfig="showChartControlConfig"
      :isDefaultStyle="true"
      :chartControls="chartControls"
      container-id="app"
      class="filter-panel"
      boundary="scrollParent"
      placement="top"
      @onApplyFilter="handleApplyFilter"
      @onRemove="emitDeleteEvent"
      @onValuesChanged="handleApplyFilter"
    >
      <template #conditionName>
        <ChangeFieldButton
          ref="changeFieldButton"
          :node="conditionTreeNode"
          :nodeIndex="nodeIndex"
          @onChangedField="newField => handleOnChangedField(andGroup, conditionTreeNode, nodeIndex, newField)"
        >
        </ChangeFieldButton>
      </template>
    </InternalFilterPanel>
    <div class="more-icon btn-icon-border" v-if="!isReadOnly">
      <i class="di-icon-three-dot" @click="handleOpenMenu"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { ConditionTreeNode } from '@/shared';
import { ChartControl, InternalFilter, InlineSqlView, SqlQuery } from '@core/common/domain/model';
import { ChartUtils, SchemaUtils, TimeoutUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import ChangeFieldButton from '@/screens/chart-builder/config-builder/filter-panel/ChangeFieldButton.vue';
import InternalFilterPanel from '@/shared/components/filters/dynamic-filter-panel/InternalFilterPanel.vue';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import ChipListing, { ChipData } from '@/shared/components/ChipListing.vue';
import { Log } from '@core/utils';

@Component({
  components: {
    ChangeFieldButton,
    InternalFilterPanel,
    ChipListing
  }
})
export default class FilterItem extends Vue {
  private currentFilter: InternalFilter = InternalFilter.empty();

  @Prop({ required: true, type: Array })
  private andGroup!: ConditionTreeNode[];

  @Prop({ required: true, type: Number })
  readonly groupIndex!: number;

  @Prop({ required: true, type: Number })
  readonly nodeIndex!: number;

  @Prop({ required: true })
  readonly conditionTreeNode!: ConditionTreeNode;

  @Prop({ required: true, type: Number })
  private opacity!: number;

  @Prop({ type: Boolean, default: true })
  private readonly showChartControlConfig!: boolean;

  // id pattern: filter-[groupId]-[nodeId]
  @Prop({ required: true, type: String })
  readonly filterId!: string;

  @Prop({ required: false, default: false })
  private readonly isReadOnly!: boolean; ///Không hiện thị nút config

  @Ref()
  private readonly changeFieldButton!: ChangeFieldButton;

  @Ref()
  private readonly filterPanel!: InternalFilterPanel;

  protected get chartControls(): ChartControl[] {
    return _BuilderTableSchemaStore.chartControls.filter(control => control.getValueController() && control.getValueController()?.isEnableControl());
  }

  @Watch('conditionTreeNode', { immediate: true, deep: true })
  private handleOnChangedNode() {
    if (ChartUtils.isDiffFieldValue(this.currentFilter.field, this.conditionTreeNode.field)) {
      const clonedNode = cloneDeep(this.conditionTreeNode);
      this.currentFilter = this.toInternalFilter(clonedNode);
    }
  }

  private handleOnChangedField(group: ConditionTreeNode[], oldNode: ConditionTreeNode, nodeIndex: number, newField: FieldDetailInfo, reRender = true): void {
    const newNode: ConditionTreeNode = this.fromFieldDetailInfo(oldNode, newField);
    if (ChartUtils.isDiffFieldValue(oldNode.field, newNode.field)) {
      ChartUtils.setDefaultValue(newNode);
    }
    this.$emit('onChangedFilter', group, newNode, nodeIndex, reRender);
  }

  private fromFieldDetailInfo(node: ConditionTreeNode, field: FieldDetailInfo): ConditionTreeNode {
    const newNode = cloneDeep(node);
    newNode.field = field.field;
    newNode.title = field.displayName;
    return newNode;
  }

  private handleOpenMenu(mouseEvent: MouseEvent): void {
    const data = [
      mouseEvent,
      {
        conditionTreeNode: this.conditionTreeNode,
        i: this.groupIndex,
        j: this.nodeIndex,
        editFn: this.showFilter
      }
    ];
    // workaround: don't use event.stopPropagation(), because other popup will not close.
    TimeoutUtils.waitAndExec(null, () => this.$emit('onOpenMenu', data), 80);
  }

  @Emit('onClickFilter')
  private showFilter(): string {
    return this.filterId;
  }

  protected toInternalFilter(node: ConditionTreeNode): InternalFilter {
    if (node.field) {
      const query: string | undefined = _BuilderTableSchemaStore.getSqlQuery(node.field.tblName);
      const sqlView: any = query ? new InlineSqlView(node.field.tblName, new SqlQuery(query)) : void 0;
      const filter = InternalFilter.from(node.field, node.title, SchemaUtils.isNested(node.field.tblName), this.conditionTreeNode.id, sqlView);
      filter.currentValues = node.allValues;
      filter.filterModeSelected = node.filterModeSelected;
      filter.currentInputType = node.currentInputType;
      filter.currentOptionSelected = node.currentOptionSelected;
      filter.controlId = node.controlId ?? null;
      return filter;
    } else {
      const filter = InternalFilter.empty();
      filter.setTitle(node.title);
      filter.controlId = node.controlId ?? null;
      return filter;
    }
  }

  private handleApplyFilter(): void {
    const newFilter = this.currentFilter;
    this.currentFilter = newFilter; //Re render UI
    const clonedNode = this.buildNodeFromFilter(this.conditionTreeNode, newFilter);
    this.$emit('onChangedFilter', this.andGroup, clonedNode, this.nodeIndex, true);
  }

  private buildNodeFromFilter(node: ConditionTreeNode, newFilter: InternalFilter): ConditionTreeNode {
    const newNode: ConditionTreeNode = cloneDeep(node);
    newNode.allValues = newFilter.currentValues;
    newNode.firstValue = newFilter.currentValues[0];
    newNode.secondValue = newFilter.currentValues[1];

    newNode.filterModeSelected = newFilter.filterModeSelected;
    newNode.currentInputType = newFilter.currentInputType;
    newNode.currentOptionSelected = newFilter.currentOptionSelected;
    newNode.filterType = newFilter.currentOptionSelected;
    newNode.controlId = newFilter.controlId ?? void 0;

    return newNode;
  }

  private emitDeleteEvent(): void {
    this.$emit('delete', this.groupIndex, this.nodeIndex);
  }

  public setupField(): void {
    this.changeFieldButton?.click((newField: FieldDetailInfo) => {
      this.handleOnChangedField(this.andGroup, this.conditionTreeNode, this.nodeIndex, newField, false);
      this.setupFilterValue();
    });
  }

  public setupFilterValue(): void {
    this.$root.$emit('bv::hide::popover');
    //
    // Wait for animation adding completed
    this.$nextTick(() => {
      this.$nextTick(() => {
        this.filterPanel?.showPopover();
      });
    });
  }
}
</script>

<style lang="scss" scoped>
@import 'node_modules/bootstrap/scss/bootstrap-grid';

.item {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  overflow: hidden;
  padding: 4px 8px;
  text-align: left;
  width: 100%;
  align-items: center;

  > div.filter-panel {
    overflow: hidden;
    flex: 1;

    ::v-deep.di-button {
      max-width: 200px;
      //flex-shrink: 1;
      overflow: hidden;
    }
  }

  &:not(:first-child) {
    margin-top: 8px;
  }

  .more-icon {
    cursor: pointer;
    display: flex;
    height: 20px;
    margin-left: auto;
    width: 20px;
    justify-content: center;
    align-items: center;
    align-self: flex-start;

    > i {
      font-size: 14px;
    }
  }

  ::v-deep {
    .dynamic-filter-panel {
      .view-panel {
        padding: 0;
      }
    }
  }
}
</style>
