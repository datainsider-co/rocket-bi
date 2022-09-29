/*
 * @author: tvc12 - Thien Vi
 * @created: 7/28/21, 1:24 PM
 */

import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import ConfigModal from '@/screens/chart-builder/config-builder/config-panel/ConfigModal.vue';
import { Accept, CloneWhenDrop, Deny, DragCustomEvent, DropOptions, GroupConfig } from '@/screens/chart-builder/config-builder/config-panel/DragConfig';
import DraggableItem from '@/screens/chart-builder/config-builder/config-panel/DraggableItem.vue';
import CalculatedFieldModal from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldModal.vue';
import { FunctionFamilyBuilder } from '@/screens/chart-builder/config-builder/function-builder/FunctionFamilyBuilder';
import { FunctionNodeBuilder } from '@/screens/chart-builder/config-builder/function-builder/FunctionNodeBuilder';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import { ConfigType, DataBuilderConstants, FunctionFamilyInfo, FunctionFamilyTypes, SortTypes, Status } from '@/shared';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import DropArea from '@/shared/components/DropArea.vue';
import DropItem from '@/shared/components/DropItem.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { ConditionTreeNode, DataFlavor, DraggableConfig, FunctionData, FunctionNode, FunctionTreeNode, LabelNode } from '@/shared/interfaces';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { ChartUtils, DomUtils, ListUtils, RandomUtils, SchemaUtils, TimeoutUtils } from '@/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { Column, DatabaseSchema, ExpressionField, Field, FieldType, TableSchema } from '@core/common/domain/model';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { DataType } from '@core/schema/service/FieldFilter';
import { FunctionDataUtils, Log } from '@core/utils';
import { isArray } from 'highcharts';
import { cloneDeep, isNumber } from 'lodash';
import VueContext from 'vue-context';
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import draggable from 'vuedraggable';

export interface ContextData {
  data: { node: FunctionTreeNode; i: number };
}

@Component({
  components: {
    ConfigModal,
    DropArea,
    draggable,
    VueContext,
    DropItem,
    StatusWidget,
    DraggableItem,
    EmptyDirectory,
    CalculatedFieldModal
  }
})
export default class ConfigDraggable extends Vue {
  // private readonly functions: FunctionNode[] = DataBuilderConstants.FUNCTION_NODES;
  private readonly sorts: LabelNode[] = DataBuilderConstants.SORTS_NODES;

  @Prop({ required: true })
  private config!: DraggableConfig;

  @Prop({ type: Boolean, default: false })
  private hasDragging!: boolean;

  @Prop({ type: Boolean, default: true })
  private showTitle!: boolean;

  @Prop({ type: Boolean, default: true })
  private showHelpIcon!: boolean;
  private currentFunctions: FunctionTreeNode[] = [];
  private selectedNode: FunctionTreeNode | null = null;
  private editingNode: FunctionTreeNode | null = null;
  private isModalOpen = false;
  private isItemDragging = false;
  private titleOfModal = '';
  private selectedDatabaseSchema: DatabaseSchema | null = null;
  private fieldContextStatus = Status.Loading;
  private errorMessage = '';
  private profileFields: FieldDetailInfo[] = [];

  private fieldOptions: DropdownData[] = [];
  @Ref()
  private fnFamilyContext!: any;
  @Ref()
  private fnTypeContext!: any;
  @Ref()
  private menu!: any;
  @Ref()
  private sortingContext!: any;
  @Ref()
  private fieldContext!: any;
  @Ref()
  private dbFieldContext!: any;

  @Ref()
  private calculatedFieldModal!: CalculatedFieldModal;

  private get enableSorting(): boolean {
    return this.configType == ConfigType.sorting;
  }

  private get configType(): ConfigType {
    return this.config.key;
  }

  private get defaultFunctions(): FunctionData[] {
    return _ConfigBuilderStore.configsAsMap.get(this.config.key) ?? [];
  }

  private get isShowPlaceHolder(): boolean {
    return this.canDrop;
  }

  private subFunctionGroups(node: FunctionTreeNode | null): any[] {
    const mainFunction = node ? this.functionOfTreeNode(node) : [];
    const subFunctions = this.selectedNode?.functionFamily ? mainFunction.find(func => func.label === this.selectedNode?.functionFamily)?.subFunctions : null;
    const options: any[] = [];
    if (subFunctions && Array.isArray(subFunctions)) {
      subFunctions.forEach(item => {
        options.push(item);
        if (item.type === 'group') {
          item.options?.forEach(option => options.push(option));
        }
      });
    }
    return options;
  }

  private subFunctions(node: FunctionTreeNode | null): FunctionNode[] | null {
    const mainFunction = node ? this.functionOfTreeNode(node) : [];
    const _subFunctions = this.editingNode?.functionFamily ? mainFunction.find(func => func.label === this.editingNode?.functionFamily)?.subFunctions : null;
    return _subFunctions && isArray(_subFunctions) ? _subFunctions : null;
  }

  private get canDrop(): boolean {
    if (isNumber(this.config.maxItem)) {
      return this.currentFunctions.length < this.config.maxItem!;
    } else {
      return true;
    }
  }

  private get canReplace(): boolean {
    if (isNumber(this.config.maxItem)) {
      return this.config.maxItem! === 1 && this.currentFunctions.length === this.config.maxItem!;
    } else {
      return false;
    }
  }

  private get canDraggable(): boolean {
    return ListUtils.isNotEmpty(this.currentFunctions);
  }

  // https://github.com/SortableJS/Sortable#event-object-demo
  private get groupConfig(): GroupConfig {
    return {
      name: this.config.key,
      put: this.handlePut,
      // ability to move from the list, clone/move/ or none
      pull: this.handlePull,
      revertClone: true
    };
  }

  private handlePut(toData: any, fromData: any): Accept | Deny {
    return this.canDrop ? DropOptions.Accept : DropOptions.Deny;
  }

  // return none/move/clone
  private handlePull(toData: any, fromData: any): Accept | Deny | CloneWhenDrop {
    if (this.isSameDropSection({ to: toData.el } as any)) {
      return DropOptions.Accept;
    } else {
      return DropOptions.CloneWhenDrop;
    }
  }

  @Watch('defaultFunctions', { immediate: true })
  private onDefaultConfigsChanged(listFunctionData: FunctionData[]) {
    this.currentFunctions = FunctionDataUtils.toFunctionTreeNodes(listFunctionData);
  }

  private async handleFunctionFamilyChanged(node: FunctionNode, context: ContextData): Promise<void> {
    const { i } = context.data;
    const functionNode: FunctionTreeNode = this.currentFunctions[i];
    functionNode.displayAsColumn = false;
    const field: Field = ChartUtils.getField(functionNode) as Field;
    const functionFamilyInfo = new FunctionFamilyBuilder()
      .withField(field)
      .withSelectedFunction(node.label as FunctionFamilyTypes)
      .build();

    Vue.set(functionNode, 'functionFamily', functionFamilyInfo.family);
    Vue.set(functionNode, 'functionType', functionFamilyInfo.type);

    _ConfigBuilderStore.updateConfig({
      configType: this.configType,
      data: ConfigDataUtils.createFunctionData(functionNode)
    });
    this.$emit('onConfigChange');
  }

  private async handleFunctionTypeChanged(node: FunctionNode, context: ContextData): Promise<void> {
    const { i } = context.data;
    const currentConfig: FunctionTreeNode = this.currentFunctions[i];
    currentConfig.functionType = node.label;
    _ConfigBuilderStore.updateConfig({
      configType: this.configType,
      data: ConfigDataUtils.createFunctionData(context.data.node)
    });
    this.$emit('onConfigChange');
  }

  private async handleSortingChanged(sort: LabelNode, contextData: ContextData): Promise<void> {
    const { i } = contextData.data;
    const currentConfig: FunctionTreeNode = this.currentFunctions[i];
    currentConfig.sorting = sort.label;
    _ConfigBuilderStore.updateConfig({
      configType: this.configType,
      data: ConfigDataUtils.createFunctionData(contextData.data.node)
    });
    this.$emit('onConfigChange');
  }

  private openContext(target: VueContext, event: Event, data?: ContextData['data']): void {
    if (data?.node) {
      this.selectedNode = data.node;
    }
    this.closeAllContext(target);
    target.open(event, data);
  }

  private closeAllContext(target: VueContext) {
    Object.values(this.$refs).map((ref: any) => {
      if (ref !== target && ref.close) {
        ref.close();
      }
    });
  }

  private async handleDrop(data: DataFlavor<FunctionTreeNode>): Promise<void> {
    Log.debug('handleDrop::data', data);
    if (data && data.node) {
      const newData: FunctionTreeNode = new FunctionNodeBuilder(data.node, this.config)
        .withRandomId()
        .withSortInfo(this.enableSorting)
        .build();
      Log.debug('handleDrop::newData::', newData);
      this.currentFunctions.push(newData);
      const func: FunctionData = ConfigDataUtils.createFunctionData(newData);
      _ConfigBuilderStore.addConfig({
        configType: this.configType,
        data: func
      });
      this.$emit('onConfigChange');
    }
  }

  private async removeItem(index: number): Promise<void> {
    const config = this.currentFunctions[index];
    this.currentFunctions.splice(index, 1);
    _ConfigBuilderStore.removeConfig({
      configType: this.configType,
      id: config.id
    });
    this.$emit('onConfigChange');
  }

  private isExpressionField(node: FunctionTreeNode): boolean {
    return node.field?.className === FieldType.ExpressionField;
  }

  private editExpression(node: FunctionTreeNode) {
    this.selectedNode = node;
    const tableSchema = _BuilderTableSchemaStore.databaseSchema?.tables.find(table => table.name === node?.field?.tblName);
    const column = tableSchema?.expressionColumns?.find(column => column.name === node?.field?.fieldName);
    if (tableSchema && column) {
      this.calculatedFieldModal.showEditModal(TableSchema.fromObject(tableSchema), column, false);
    }
  }

  private handleUpdateTableSchema(tableSchema: TableSchema, oldColumn: Column, newColumn: Column) {
    this.closeOptions();
    const oldField: Field = new ExpressionField(
      tableSchema.dbName,
      tableSchema.name,
      oldColumn.name,
      oldColumn.className,
      oldColumn.defaultExpression?.expr ?? ''
    );
    const newField: Field = new ExpressionField(
      tableSchema.dbName,
      tableSchema.name,
      newColumn.name,
      newColumn.className,
      newColumn.defaultExpression?.expr ?? ''
    );
    _ConfigBuilderStore.updateField({ oldField, newField });
    _BuilderTableSchemaStore.setTableSchema(tableSchema);
    _BuilderTableSchemaStore.expandTables([tableSchema.name]);
    this.selectedNode = null;
    this.$emit('onConfigChange');
  }

  private openModal(node: FunctionTreeNode): void {
    this.selectedNode = node;
    this.editingNode = cloneDeep(node);
    // nodeJSON.parse(JSON.stringify(node));
    this.titleOfModal = node.displayName;
    this.isModalOpen = true;
    node.optionsOpened = false;
  }

  private closeOptions(): void {
    this.currentFunctions.map(config => {
      if (config.optionsOpened) {
        config.optionsOpened = false;
      }
    });
  }

  private isSameDropSection(event: DragCustomEvent): boolean {
    const dragConfig: DraggableConfig | undefined = ConfigDataUtils.getDraggableConfig(event.to);
    if (dragConfig) {
      return dragConfig.key == this.config.key;
    } else {
      return false;
    }
  }

  private isIndexChanged(data: { oldDraggableIndex: number; newDraggableIndex: number }): boolean {
    return data.oldDraggableIndex !== data.newDraggableIndex;
  }

  private async handleFunctionChanged(event: DragCustomEvent): Promise<void> {
    this.isItemDragging = false;
    this.emitItemDragging(false);
    if (this.isSameDropSection(event) && this.isIndexChanged(event)) {
      const listFunctionData = this.currentFunctions.map(config => ConfigDataUtils.createFunctionData(config));
      _ConfigBuilderStore.changeIndex({
        configs: listFunctionData,
        configType: this.configType
      });
      this.$emit('onConfigChange');
    }
  }

  private handleRemoveOldFunction(event: DragCustomEvent) {
    const canRemoveOldFunction = this.config.key != ConfigType.sorting;
    const fromConfig: DraggableConfig | undefined = ConfigDataUtils.getDraggableConfig(event.from);
    if (canRemoveOldFunction && fromConfig && fromConfig.key != ConfigType.sorting) {
      _ConfigBuilderStore.removeFunctionAt({
        configType: fromConfig.key,
        index: event.oldDraggableIndex
      });
    }
  }

  private async handleDropFromOtherSection(event: DragCustomEvent): Promise<void> {
    if (ConfigDataUtils.isFromFilterSection(event)) {
      await this.dropFromFilterSection(event);
    } else {
      await this.dropFromFunctionSection(event);
    }
  }

  private async dropFromFilterSection(event: DragCustomEvent): Promise<void> {
    const { group, groupIndex } = ConfigDataUtils.getFilterGroupInfo(event.from);
    if (!!group && isNumber(groupIndex)) {
      const fromIndex = event.oldDraggableIndex;
      const toIndex = event.newDraggableIndex;
      const conditionNode: ConditionTreeNode = group[fromIndex];
      DomUtils.bind('conditionNode', conditionNode);
      const currentFunction: FunctionTreeNode = ConfigDataUtils.toFunctionNode(conditionNode, this.config, this.enableSorting);
      await this.handleInsertFunction([currentFunction, toIndex]);
    }
  }

  private async dropFromFunctionSection(event: DragCustomEvent): Promise<void> {
    const index = event.newDraggableIndex;
    const currentFunction: FunctionTreeNode = this.currentFunctions[index];
    // Remove current function at index
    // Because lib auto assign new function in to currentFunctions, before handleAdd called
    this.currentFunctions.splice(index, 1);
    this.handleRemoveOldFunction(event);
    await this.handleInsertFunction([currentFunction, index]);
  }

  private async handleInsertFunction(payload: [FunctionTreeNode, number]): Promise<void> {
    Log.debug('handleInsertFunction::payload', payload);
    const [node, index] = payload;
    if (node) {
      const newData = new FunctionNodeBuilder(node, this.config)
        .withRandomId()
        .withSortInfo(this.enableSorting)
        .build();
      this.currentFunctions.splice(index, 0, newData);
      const data = ConfigDataUtils.createFunctionData(newData);
      _ConfigBuilderStore.addConfig({
        data: data,
        configType: this.configType,
        index: index
      });
      this.$emit('onConfigChange');
    }
  }

  private async handleReplaceFunction(payload: [FunctionTreeNode, number]) {
    const [node, index] = payload;
    if (node) {
      let configMerged = this.mergeConfig(node, index);
      Log.debug('handleReplaceFunction::', configMerged);
      if (ChartUtils.isDifferentFieldType(this.currentFunctions[index].field, configMerged.field)) {
        configMerged = this.setDefaultFunction(configMerged);
      }
      await this.updateConfig(configMerged, index);
    }
  }

  private async updateConfig(newConfig: FunctionTreeNode, index: number): Promise<void> {
    this.currentFunctions.splice(index, 1, newConfig);
    _ConfigBuilderStore.updateConfig({
      data: ConfigDataUtils.createFunctionData(newConfig),
      configType: this.configType
    });
    this.$emit('onConfigChange');
  }

  private mergeConfig(node: FunctionTreeNode, index: number) {
    const newConfig: FunctionTreeNode = new FunctionNodeBuilder(node, this.config)
      .withRandomId()
      .withSortInfo(this.enableSorting)
      .build();
    const currentConfig: FunctionTreeNode = this.currentFunctions[index];
    return ChartUtils.mergeConfig(currentConfig, newConfig);
  }

  private handleSaveConfig(data: FunctionTreeNode) {
    if (this.selectedNode) {
      this.selectedNode.functionFamily = data.functionFamily || '';
      this.selectedNode.functionType = data.functionType || '';
      this.selectedNode.displayName = data.displayName;
      this.selectedNode.selectedCondition = data.functionFamily + ' ' + data.functionType;
      this.selectedNode.sorting = data.sorting;
      this.selectedNode.displayAsColumn = data.displayAsColumn;
      this.selectedNode.isShowNElements = data.isShowNElements;
      this.selectedNode.numElemsShown = data.numElemsShown;
    }
    data.selectedConfig = data.functionFamily + ' ' + data.functionType;

    this.isModalOpen = false;

    this.closeOptions();
    _ConfigBuilderStore.updateConfig({
      data: ConfigDataUtils.createFunctionData(data),
      configType: this.configType
    });
    this.$emit('onConfigChange');
  }

  private handleChangeField(child: ContextData, profileField: FieldDetailInfo) {
    let clonedNode = ConfigDataUtils.createNewNode(child.data.node, profileField);
    if (ChartUtils.isDifferentFieldType(child.data.node.field, profileField.field)) {
      clonedNode = this.setDefaultFunction(clonedNode);
    }
    this.updateConfig(clonedNode, child.data.i);
  }

  private async handleClickField(target: any, event: any, data: ContextData['data']) {
    Log.debug('handleClickField::', target, event, data);
    this.openContext(target, event, data);

    if (this.selectedNode && this.selectedNode.field) {
      if (this.selectedNode.field.dbName === _BuilderTableSchemaStore.dbNameSelected) {
        this.fieldContextStatus = Status.Loaded;
        const selectedTable = _BuilderTableSchemaStore.databaseSchema?.tables.find(table => table.name === this.selectedNode?.field?.tblName);
        if (selectedTable) {
          const profileFields: FieldDetailInfo[] = selectedTable.columns.map(
            column =>
              new FieldDetailInfo(
                Field.new(selectedTable.dbName, selectedTable.name, column.name, column.className),
                column.name,
                column.displayName,
                SchemaUtils.isNested(selectedTable.name),
                false
              )
          );
          this.profileFields = profileFields;
        } else {
          this.fieldContextStatus = Status.Error;
          this.errorMessage = "Can't find fields of this table";
        }
      } else {
        try {
          this.selectedDatabaseSchema =
            _BuilderTableSchemaStore.databaseSchema || (await DatabaseSchemaModule.handleGetDatabaseSchema(this.selectedNode.field.dbName));
          if (this.selectedDatabaseSchema) {
            const selectedTable = this.selectedDatabaseSchema.tables.find(table => table.name === this.selectedNode?.field?.tblName);
            if (selectedTable) {
              this.profileFields = selectedTable.columns.map(
                column =>
                  new FieldDetailInfo(
                    Field.new(selectedTable.dbName, selectedTable.name, column.name, column.className),
                    column.name,
                    column.displayName,
                    SchemaUtils.isNested(selectedTable.name),
                    false
                  )
              );
              this.fieldContextStatus = Status.Loaded;
              Log.debug(this.fieldContextStatus, 'status');
            }
          }
        } catch (ex) {
          this.fieldContextStatus = Status.Error;
          this.errorMessage = ex;
        }
      }
    }
  }

  private setDefaultFunction(newNode: FunctionTreeNode): FunctionTreeNode {
    if (newNode.field) {
      const functionFamilyInfo: FunctionFamilyInfo = new FunctionFamilyBuilder()
        .withField(newNode.field)
        .withConfig(this.config)
        .build();
      newNode.functionFamily = functionFamilyInfo.family;
      newNode.functionType = functionFamilyInfo.type;
      return newNode;
    } else {
      return new FunctionNodeBuilder(newNode, this.config).withSortInfo(this.enableSorting).build();
    }
  }

  private emitItemDragging(isDragging: boolean): void {
    this.$emit('onItemDragging', isDragging, this.config.key);
  }

  private handleDragItem(): void {
    PopupUtils.hideAllPopup();
    this.isItemDragging = true;
    this.emitItemDragging(true);
  }

  private functionOfTreeNode(node: FunctionTreeNode | null): FunctionNode[] {
    Log.debug('functionOfTreeNode::', node);
    switch (node?.field?.getDataType()) {
      case DataType.Text:
        return DataBuilderConstants.TEXT_FUNCTION_NODES;
      case DataType.Number:
        return DataBuilderConstants.NUMBER_FUNCTION_NODES;
      case DataType.Date:
        return DataBuilderConstants.DATE_FUNCTION_NODES;
      case DataType.Expression:
        return DataBuilderConstants.EXPRESSION_FUNCTION_NODES;
      default:
        return [];
    }
  }

  private async handleClickTooltip(target: any, event: any): Promise<void> {
    TimeoutUtils.waitAndExec(null, () => this.openContext(target, event), 150);
    const dbName = _BuilderTableSchemaStore.dbNameSelected;
    await this.initTablesOptions(dbName);
  }

  private async initTablesOptions(dbName: string): Promise<void> {
    this.fieldContextStatus = Status.Loading;
    const dbSchema = _BuilderTableSchemaStore.databaseSchema || (await DatabaseSchemaModule.handleGetDatabaseSchema(dbName));
    this.selectedDatabaseSchema = dbSchema;
    this.fieldOptions = SchemaUtils.toFieldDetailInfoOptions(cloneDeep(dbSchema));
    this.fieldContextStatus = Status.Loaded;
  }

  private async handleSelectColumn(fieldDetail: FieldDetailInfo) {
    //build func family & sub function
    //convert field to function data (field + func family + sub function)
    //build function tree node from function data
    //handle insert function tree node (index is current)
    const functionData = this.buildFunctionData(fieldDetail);
    Log.debug('ConfigDraggable::handleSelectColumn', functionData);
    const treeNode = FunctionDataUtils.toFunctionTreeNodes([functionData])[0];
    return this.handleInsertFunction([treeNode, this.currentFunctions.length]);
  }

  private buildFunctionData(fieldDetail: FieldDetailInfo) {
    const { field, name, displayName, isNested } = fieldDetail;
    const { tblName } = field;
    const fnFamily = new FunctionFamilyBuilder()
      .withField(field)
      .withConfig(this.config)
      .build();
    const tblSchema = _BuilderTableSchemaStore.databaseSchema?.searchTables(tblName)[0];
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
      data: tblSchema,
      sorting: SortTypes.Unsorted
    };
  }
}
