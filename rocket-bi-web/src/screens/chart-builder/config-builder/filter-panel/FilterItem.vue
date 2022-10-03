<template>
  <div class="item">
    <DynamicFilterPanel
      :id="filterId"
      :filter.sync="currentFilter"
      :isShowDisable="false"
      :maxChipShowing="3"
      class="filter-panel"
      boundary="scrollParent"
      placement="top"
      @onApplyFilter="handleApplyFilter"
      @onRemove="handleDeleteFilter"
      @onValuesChanged="handleApplyFilter"
      :enableControlConfig="true"
      :isDefaultStyle="true"
    >
      <template #filter-value v-if="hasDynamicCondition">
        <ChipListing :listChipData="tabControlChipData" @removeAt="handleRemoveTabControl" @onChipClicked="showFilter"></ChipListing>
      </template>
      <template #conditionName>
        <ChangeFieldButton
          :conditionTreeNode="conditionTreeNode"
          :error-message="errorMessage"
          :field-context-status="fieldContextStatus"
          :nodeIndex="nodeIndex"
          :profile-fields="profileFields"
          :title="conditionTreeNode.title"
          @handleChangeField="handleChangeField(andGroup, conditionTreeNode, nodeIndex, ...arguments)"
          @handleClickButton="handleOnClickField"
        >
        </ChangeFieldButton>
      </template>
    </DynamicFilterPanel>
    <div class="more-icon btn-icon-border" v-if="!isReadOnly">
      <i class="di-icon-three-dot" @click="handleOpenMenu"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import { ConditionTreeNode, Status } from '@/shared';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DatabaseSchema, DynamicFilter, InlineSqlView, SqlQuery } from '@core/common/domain/model';
import { ChartUtils, SchemaUtils, TimeoutUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import ChangeFieldButton from '@/screens/chart-builder/config-builder/filter-panel/ChangeFieldButton.vue';
import DynamicFilterPanel from '@/shared/components/filters/dynamic-filter-panel/DynamicFilterPanel.vue';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import ChipListing, { ChipData } from '@/shared/components/ChipListing.vue';
import { Log } from '@core/utils';

@Component({
  components: {
    ChangeFieldButton,
    DynamicFilterPanel,
    ChipListing
  }
})
export default class FilterItem extends Vue {
  private errorMessage = '';
  private fieldContextStatus = Status.Loaded;
  private profileFields: FieldDetailInfo[] = [];

  @Prop({ required: true, type: Array })
  private andGroup!: ConditionTreeNode[];

  @Prop({ required: true, type: Number })
  private groupIndex!: number;

  @Prop({ required: true, type: Number })
  private nodeIndex!: number;

  @Prop({ required: true })
  private conditionTreeNode!: ConditionTreeNode;

  @Prop({ required: true, type: Number })
  private opacity!: number;

  @Prop({ required: false, type: Function, default: undefined })
  private readonly fnShowFilter?: (filterId: number) => void;

  private currentFilter: DynamicFilter = DynamicFilter.empty();

  // id pattern: filter-[groupId]-[nodeId]
  @Prop({ required: true, type: String })
  private readonly filterId!: string;

  @Prop({ required: false, default: false })
  private readonly isReadOnly!: boolean; ///Không hiện thị nút config

  @Watch('conditionTreeNode', { immediate: true, deep: true })
  handleOnConditionNodeChanged() {
    if (this.conditionTreeNode.field && SchemaUtils.isDiff(this.currentFilter.field, this.conditionTreeNode.field)) {
      const clonedNode = cloneDeep(this.conditionTreeNode);
      this.currentFilter = this.getDynamicFilter(clonedNode);
    }
  }

  private isDbAlreadyLoaded(dbName: string) {
    return dbName === _BuilderTableSchemaStore.dbNameSelected;
  }

  private handleOnClickField(data: { conditionTreeNode: ConditionTreeNode; index: number }) {
    if (data.conditionTreeNode) {
      const selectedConditionNode = ChartUtils.toConditionData(data.conditionTreeNode);
      if (_BuilderTableSchemaStore.databaseSchema && this.isDbAlreadyLoaded(selectedConditionNode.field.dbName)) {
        this.loadProfileFields(_BuilderTableSchemaStore.databaseSchema, selectedConditionNode.field.tblName);
      } else {
        DatabaseSchemaModule.handleGetDatabaseSchema(selectedConditionNode.field.dbName)
          .then(selectedDatabaseSchema => this.loadProfileFields(selectedDatabaseSchema, selectedConditionNode.field.tblName))
          .catch(e => {
            this.fieldContextStatus = Status.Error;
            this.errorMessage = 'Load table error, try again';
          });
      }
    }
  }

  private loadProfileFields(databaseSchema: DatabaseSchema, tblName: string) {
    this.fieldContextStatus = Status.Loaded;
    this.profileFields = ChartUtils.getProfileFieldsFromDBSchemaTblName(databaseSchema, tblName);
  }

  @Emit('onFilterChanged')
  private handleChangeField(
    group: ConditionTreeNode[],
    conditionTreeNode: ConditionTreeNode,
    nodeIndex: number,
    profileField: FieldDetailInfo
  ): [ConditionTreeNode[], ConditionTreeNode, number] {
    const newNode: ConditionTreeNode = this.handleMergeField(conditionTreeNode, profileField);
    if (conditionTreeNode.field && SchemaUtils.isDiff(conditionTreeNode.field, profileField.field)) {
      ChartUtils.resetNodeData(newNode);
    }
    return [group, newNode, nodeIndex];
  }

  private handleMergeField(conditionTreeNode: ConditionTreeNode, profileField: FieldDetailInfo) {
    const clonedNode = cloneDeep(conditionTreeNode);
    clonedNode.field = profileField.field;
    clonedNode.title = profileField.displayName;
    return clonedNode;
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
    Log.debug('FilterItem::showFilter', this.currentFilter.control);
    return this.filterId;
  }

  private getDynamicFilter(conditionTreeNode: ConditionTreeNode) {
    if (conditionTreeNode.field) {
      const query = _BuilderTableSchemaStore.getSqlQuery(conditionTreeNode.field.tblName);
      const sqlView = query ? new InlineSqlView(conditionTreeNode.field.tblName, new SqlQuery(query)) : void 0;
      const filter = DynamicFilter.from(
        conditionTreeNode.field,
        conditionTreeNode.title,
        SchemaUtils.isNested(conditionTreeNode.field.tblName),
        this.conditionTreeNode.id,
        sqlView
      );
      this.setExtraData(filter, conditionTreeNode);
      return filter;
    } else {
      return DynamicFilter.empty();
    }
  }

  private setExtraData(filter: DynamicFilter, conditionTreeNode: ConditionTreeNode) {
    filter.currentValues = conditionTreeNode.allValues;
    filter.filterModeSelected = conditionTreeNode.filterModeSelected;
    filter.currentInputType = conditionTreeNode.currentInputType;
    filter.currentOptionSelected = conditionTreeNode.currentOptionSelected;
    Log.debug('setExtraData', filter, conditionTreeNode);
    filter.control = cloneDeep(conditionTreeNode.tabControl);
  }

  @Emit('onFilterChanged')
  private handleApplyFilter(): [ConditionTreeNode[], ConditionTreeNode, number] {
    Log.debug('FilterItem::handleApplyFilter::', this.currentFilter.currentOptionSelected);
    const newFilter = this.currentFilter;
    this.currentFilter = newFilter; //Re render UI
    const clonedNode = this.updateConditionNode(this.conditionTreeNode, newFilter);
    Log.debug('FilterItem::handleApplyFilter::', this.currentFilter.currentOptionSelected);
    return [this.andGroup, clonedNode, this.nodeIndex];
  }

  private updateConditionNode(conditionTreeNode: ConditionTreeNode, newFilter: DynamicFilter) {
    const newNode: ConditionTreeNode = cloneDeep(conditionTreeNode);
    newNode.allValues = newFilter.currentValues;
    newNode.firstValue = newFilter.currentValues[0];
    newNode.secondValue = newFilter.currentValues[1];

    newNode.filterModeSelected = newFilter.filterModeSelected;
    newNode.currentInputType = newFilter.currentInputType;
    newNode.currentOptionSelected = newFilter.currentOptionSelected;
    newNode.filterType = newFilter.currentOptionSelected;

    newNode.tabControl = newFilter.control;
    return newNode;
  }

  @Emit('onDeleteFilter')
  private handleDeleteFilter(): [number, number] {
    return [this.groupIndex, this.nodeIndex];
  }

  private get hasDynamicCondition(): boolean {
    return this.conditionTreeNode.tabControl !== undefined && this.conditionTreeNode.tabControl !== null;
  }

  private get tabControlChipData(): ChipData[] {
    return this.conditionTreeNode.tabControl
      ? [
          {
            title: this.conditionTreeNode.tabControl.displayName,
            isShowRemove: true
          }
        ]
      : [];
  }

  private handleRemoveTabControl() {
    this.conditionTreeNode.tabControl = void 0;
    this.currentFilter.control = void 0;
    this.handleApplyFilter();
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
