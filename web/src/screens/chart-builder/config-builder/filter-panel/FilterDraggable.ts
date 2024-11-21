import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { ConditionData, ConditionTreeNode, DataFlavor, DraggableConfig, DropMode, FunctionData, FunctionTreeNode, SortTypes } from '@/shared';
import { ChartUtils, HtmlElementRenderUtils, ListUtils, RandomUtils } from '@/utils';
import { ChartControl, ChartControlField, ExpressionField, Field, FieldDetailInfo, Id } from '@core/common/domain/model';
import DropArea from '@/shared/components/DropArea.vue';
import DropItem from '@/shared/components/DropItem.vue';
import VueContext from 'vue-context';
import { Drop } from 'vue-drag-drop';
import { CollapseTransition } from 'vue2-transitions';
import { ConditionDataUtils, FunctionDataUtils, Log } from '@core/utils';
import DiButton from '@/shared/components/common/DiButton.vue';
import FilterItem from './FilterItem.vue';
import { IdGenerator } from '@/utils/IdGenerator';
import draggable from 'vuedraggable';
import { Accept, CloneWhenDrop, Deny, DragCustomEvent, DropOptions, GroupConfig } from '@/screens/chart-builder/config-builder/config-panel/DragConfig';
import { cloneDeep, isNumber, isString } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { FunctionFamilyBuilder } from '@/screens/chart-builder/config-builder/function-builder/FunctionFamilyBuilder';
import SelectFieldContext from '@/screens/chart-builder/config-builder/config-panel/SelectFieldContext.vue';
import { EventBus } from '@/event-bus/EventBus';

@Component({
  components: {
    DropArea,
    DropItem,
    VueContext,
    Drop,
    CollapseTransition,
    DiButton,
    FilterItem,
    draggable,
    SelectFieldContext
  }
})
export default class FilterDraggable extends Vue {
  private readonly clickHereId = 'filter-click-here';
  private supportedGroupNames: Set<string> = new Set(['group-and-draggable', 'group-or-draggable']);
  private conditions: ConditionTreeNode[][] = [];
  private loaded = false;
  private isItemDragging = false;
  private insertAt?: number;

  @Prop({ required: true })
  private readonly draggableConfig!: DraggableConfig;

  @Prop({ type: Boolean, default: false })
  private readonly hasDragging!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showTitle!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly showChartControlConfig!: boolean;

  @Prop({ required: false, default: false })
  private readonly isReadOnly!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disabled!: boolean;

  @Ref()
  private readonly menu?: VueContext;

  @Ref()
  private readonly selectFieldContext!: SelectFieldContext;

  @Ref()
  private readonly filterItems!: FilterItem[];

  private get defaultConditions(): Map<Id, ConditionData[]> {
    return _ConfigBuilderStore.filterAsMap;
  }

  protected get canShowPlaceHolder(): boolean {
    return ListUtils.isEmpty(this.conditions);
  }

  protected get orGroupConfig(): GroupConfig {
    return {
      name: 'group-or-draggable',
      revertClone: true,
      put: DropOptions.Accept,
      pull: DropOptions.Deny
    };
  }

  protected get andGroupConfig(): GroupConfig {
    return {
      name: 'group-and-draggable',
      revertClone: true,
      put: DropOptions.Accept,
      pull: this.handlePull
    };
  }

  private static createConditionNodeFrom(data: ConditionTreeNode, isDifferentGroup = false): ConditionTreeNode {
    const newNode = cloneDeep(data) as ConditionTreeNode;
    newNode.id = RandomUtils.nextInt(0, 900000);
    if (isDifferentGroup) {
      newNode.groupId = RandomUtils.nextInt(0, 900000);
    }
    newNode.firstValue = data.firstValue ?? '';
    newNode.secondValue = data.secondValue ?? '';
    newNode.filterCondition = data.filterCondition ?? '';
    const field: Field = ChartUtils.getField(data)!;
    if (ChartControlField.isChartControlField(field)) {
      newNode.field = void 0;
      newNode.controlId = field.controlData.id;
    } else {
      newNode.field = field;
    }
    if (!isString(newNode.filterFamily)) {
      newNode.filterFamily = ChartUtils.getFilterFamily(newNode);
      newNode.filterType = ChartUtils.getFilterType(newNode.filterFamily);
    }
    return newNode;
  }

  private handlePull(to: any, from: any): Accept | Deny | CloneWhenDrop {
    const toGroupName: string = to.options?.group?.name ?? '';
    return this.supportedGroupNames.has(toGroupName) ? DropOptions.CloneWhenDrop : DropOptions.CloneWhenDrop;
  }

  @Watch('defaultConditions', { immediate: true })
  private handleDefaultConditionsChanged() {
    if (!this.loaded && this.defaultConditions.size !== 0) {
      this.loaded = true;
      this.conditions = ConditionDataUtils.toConditionTreeNodes(this.defaultConditions);
    }
  }

  protected dropToOrGroup(data: DataFlavor<ConditionTreeNode>, isShowConfig = true) {
    const newNode: ConditionTreeNode | null = FilterDraggable.createConditionNodeFrom(data.node, true);
    if (newNode) {
      const andGroup: ConditionTreeNode[] = [newNode];
      this.conditions.push(andGroup);
      const newCondition: ConditionData = ChartUtils.toConditionData(newNode);

      this.addCondition(DropMode.DropToOr, newCondition, () => this.onAddConditionComplete(newCondition, isShowConfig));
    }
  }

  private onAddConditionComplete(newCondition: ConditionData, isShowConfig: boolean): void {
    const filterId: string = this.getFilterConfigId(newCondition.groupId, newCondition.id);
    if (isShowConfig && !newCondition.field && newCondition.controlId) {
      this.setupField(filterId);
      return;
    }
    if (isShowConfig && newCondition.field) {
      this.setupFilterValue(filterId);
    }
  }

  private setupField(filterId: string): void {
    // Wait for animation adding completed
    this.$nextTick(() => {
      this.$nextTick(() => {
        const filterItem = this.filterItems.find(item => item.filterId === filterId);
        if (filterItem) {
          filterItem.setupField();
        }
      });
    });
  }

  protected setupFilterValue(filterId: string): void {
    // Wait for animation adding completed
    this.$nextTick(() => {
      this.$nextTick(() => {
        const filterItem = this.filterItems.find(item => item.filterId === filterId);
        if (filterItem) {
          filterItem.setupFilterValue();
        }
      });
    });
  }

  private handleDropAndGroup(andGroup: ConditionTreeNode[], data: DataFlavor<ConditionTreeNode>, event: any): void {
    Log.debug('handleDropAnd::', data.node);
    event.stopPropagation();
    const isExpressionField: boolean = ExpressionField.isExpressionField(ChartUtils.getField(data.node));
    const isDashboardControl: boolean = ChartControl.isChartControlData(data.node.data);
    if (data && data.node && !isExpressionField && !isDashboardControl) {
      const newNode: ConditionTreeNode = FilterDraggable.createConditionNodeFrom(data.node);
      newNode.groupId = andGroup[0].groupId;
      andGroup.push(newNode);

      const conditionData: ConditionData = ChartUtils.toConditionData(newNode);
      this.addCondition(DropMode.DropToAnd, conditionData, () => this.onAddConditionComplete(conditionData, true));
    }
  }

  private removeFilterItem(groupIndex: number, nodeIndex: number): void {
    const currentCondition = this.conditions[groupIndex][nodeIndex];
    this.conditions[groupIndex].splice(nodeIndex, 1);
    if (ListUtils.isEmpty(this.conditions[groupIndex])) {
      this.conditions.splice(groupIndex, 1);
    }
    _ConfigBuilderStore.removeFilter({
      groupId: currentCondition.groupId,
      id: currentCondition.id
    });
  }

  private addCondition(dropMode: DropMode, conditionData: ConditionData, onAddCompleted?: () => void) {
    switch (dropMode) {
      case DropMode.DropToAnd:
      case DropMode.DropToOr:
        {
          _ConfigBuilderStore.addFilter({
            data: conditionData,
            index: this.insertAt
          });
          this.insertAt = void 0;
        }
        break;
      // case DropMode.ReplaceToOr:
      //   {
      //     _ConfigBuilderStore.updateFilter(conditionData);
      //     this.$emit('onConfigChange');
      //   }
      //   break;
      default: {
        // do nothing
      }
    }
    onAddCompleted?.call(this);
  }

  private handleReplaceCondition(group: ConditionTreeNode[], data: [ConditionTreeNode, number]) {
    const [node, index] = data;
    // const isExpressionField: boolean = ExpressionField.isExpressionField(ChartUtils.getField(node));
    if (node) {
      const oldNode: ConditionTreeNode = group[index];
      const newNode: ConditionTreeNode = FilterDraggable.createConditionNodeFrom(node, true);
      const mergedNode: ConditionTreeNode = ChartUtils.mergeCondition(oldNode, newNode);
      if (ChartUtils.isDiffFieldType(oldNode.field, mergedNode.field)) {
        ChartUtils.setDefaultValue(mergedNode);
      }
      this.updateConditionNode(group, mergedNode, index, true);
    }
  }

  private updateConditionNode(group: ConditionTreeNode[], conditionTreeNode: ConditionTreeNode, index: number, reRender: boolean) {
    group.splice(index, 1, conditionTreeNode);
    _ConfigBuilderStore.updateFilter(ChartUtils.toConditionData(conditionTreeNode));
    if (reRender) {
      this.$emit('onConfigChange');
    }
  }

  private handleInsertCondition(group: ConditionTreeNode[], enableShowFilter: boolean, data: [ConditionTreeNode, number]) {
    const [node, index] = data;
    const field: Field | undefined = ChartUtils.getField(node);
    const isExpressionField: boolean = ExpressionField.isExpressionField(field);
    if (node && !isExpressionField) {
      const clonedNode = FilterDraggable.createConditionNodeFrom(node, true);
      this.insertAt = index;
      clonedNode.groupId = group[0]?.groupId;
      group.splice(index, 0, clonedNode);

      const conditionData: ConditionData = ChartUtils.toConditionData(clonedNode);
      this.addCondition(DropMode.DropToOr, conditionData, () => this.onAddConditionComplete(conditionData, enableShowFilter));
    }
  }

  private handleOpenMenu(data: [MouseEvent, { conditionTreeNode: ConditionTreeNode; i: number; j: number; editFn: () => void }]) {
    const [mouseEvent, menuData] = data;
    this.menu?.open(mouseEvent, menuData);
  }

  private handleDeleteFilter(groupIndex: number, nodeIndex: number): void {
    this.removeFilterItem(groupIndex, nodeIndex);
    this.$emit('onConfigChange');
  }

  // id pattern: filter-[groupId]-[nodeId]
  private getFilterConfigId(groupId: number, nodeId: number): string {
    return IdGenerator.generateFilterId(groupId, nodeId);
  }

  private handleConfigFilter(data: { editFn: () => void }): void {
    this.menu?.close();
    data.editFn();
  }

  // drag có thể đến từ mọi nguồn, nếu data có added:

  private handleAddNewGroupFromOtherSection(listFunctionTreeNode: FunctionTreeNode[]): void {
    Log.debug('handleAddNewGroupFromOtherSection::', listFunctionTreeNode);
    // always has one item in listFunctionTreeNode;
    const functionNode: FunctionTreeNode | undefined = ListUtils.getHead(listFunctionTreeNode);
    if (functionNode) {
      const conditionNode: ConditionTreeNode = FilterDraggable.createConditionNodeFrom(functionNode as any);
      this.dropToOrGroup({ node: conditionNode });
    }
  }

  private handleClickNewGroup(event: DragCustomEvent) {
    const { group, groupIndex } = ConfigDataUtils.getFilterGroupInfo(event.from);
    if (group && group.length > 1 && isNumber(groupIndex)) {
      const conditionNode: ConditionTreeNode = group[groupIndex];
      this.removeFilterItem(groupIndex, groupIndex);
      this.dropToOrGroup({ node: conditionNode }, false);
      this.$emit('onConfigChange');
    }
  }

  //      [function, index] element và newIndex => đến từ function insert at index
  private handleChangeCondition(group: ConditionTreeNode[], groupIndex: number, data: any): void {
    Log.debug('handleInsertConditionFromOtherSection::', data);
    const { element, newIndex } = data?.added ?? {};
    if (element && isNumber(newIndex)) {
      const conditionNode: ConditionTreeNode = FilterDraggable.createConditionNodeFrom(element as any);
      this.handleInsertCondition(group, true, [conditionNode, newIndex]);
    }
  }

  private handleNewConditionFromFilterSection(toGroup: ConditionTreeNode[], toGroupIndex: number, event: DragCustomEvent) {
    const { group, groupIndex } = ConfigDataUtils.getFilterGroupInfo(event.from);
    const fromIndex = event.oldDraggableIndex;
    const toIndex = event.newDraggableIndex;
    if (group && isNumber(groupIndex)) {
      const conditionNode: ConditionTreeNode = group[fromIndex];
      this.removeFilterItem(groupIndex, fromIndex);
      this.handleInsertCondition(toGroup, false, [conditionNode, toIndex]);
      this.$emit('onConfigChange');
    }
  }

  private emitItemDragging(isDragging: boolean): void {
    this.$emit('onItemDragging', isDragging, this.draggableConfig.key);
  }

  private async handleClickTooltip(event: MouseEvent): Promise<void> {
    const eventTarget = HtmlElementRenderUtils.fixMenuOverlapForContextMenu(event, this.clickHereId);
    this.selectFieldContext.showTableAndFields(eventTarget);
  }

  /**
   * build func family & sub function
   * FieldDetailInfo => FunctionData (field + func family + sub function) => FunctionTreeNode => ConditionTreeNode => ConditionData
   * handle insert ConditionData to new group
   */
  private async handleSelectColumn(field: FieldDetailInfo): Promise<void> {
    const newGroup = true;
    const functionData: FunctionData = this.toFunctionData(field);
    const functionNode: FunctionTreeNode = FunctionDataUtils.toFunctionTreeNodes([functionData])[0];
    const conditionNode: ConditionTreeNode = FilterDraggable.createConditionNodeFrom(functionNode as any, newGroup);
    const conditionData: ConditionData = ChartUtils.toConditionData(conditionNode);
    const orGroup = [conditionNode];
    this.conditions.push(orGroup);
    return this.addCondition(DropMode.DropToOr, conditionData, () => this.onAddConditionComplete(conditionData, true));
  }

  protected toFunctionData(fieldDetail: FieldDetailInfo): FunctionData {
    const { field, name, displayName, isNested } = fieldDetail;
    const { tblName } = field;
    const fnFamily = new FunctionFamilyBuilder()
      .withField(field)
      .withConfig(this.draggableConfig)
      .build();
    const { family, type } = fnFamily;
    return {
      field: field,
      functionFamily: family,
      functionType: type,
      id: RandomUtils.nextInt(),
      isNested: isNested,
      name: name,
      tableName: tblName,
      columnName: displayName,
      sorting: SortTypes.Unsorted
    };
  }
}
