/*
 * @author: tvc12 - Thien Vi
 * @created: 7/28/21, 1:32 PM
 */

import { ConditionTreeNode, DraggableConfig, FunctionData, FunctionTreeNode } from '@/shared';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { cloneDeep, compact, isNumber, replace, toLength } from 'lodash';
import { ChartUtils, ListUtils } from '@/utils';
import {
  Condition,
  DynamicFunctionWidget,
  Field,
  FieldRelatedCondition,
  NestedCondition,
  TableColumn,
  TabControlData,
  ValueCondition,
  WidgetId
} from '@core/common/domain/model';
import { DragCustomEvent } from '@/screens/chart-builder/config-builder/config-panel/DragConfig';
import { FunctionNodeBuilder } from '@/screens/chart-builder/config-builder/function-builder/FunctionNodeBuilder';
import { Log } from '@core/utils';

export class ConfigDataUtils {
  static createNewNode(currentNode: FunctionTreeNode, fieldInfo: FieldDetailInfo): FunctionTreeNode {
    const clonedNode = cloneDeep(currentNode);
    clonedNode.field = fieldInfo.field;
    clonedNode.displayName = fieldInfo.displayName;
    clonedNode.title = fieldInfo.displayName;
    return clonedNode;
  }

  static createFunctionData(node: FunctionTreeNode): FunctionData {
    const field = ChartUtils.getField(node) as Field;
    return {
      id: node.id,
      field: field,
      functionFamily: node.functionFamily,
      functionType: node.functionType,
      name: node.displayName,
      sorting: node.sorting,
      tableName: node.parent.title,
      columnName: node.title,
      displayAsColumn: node.displayAsColumn,
      isNested: node.isNested || node?.path?.length > 2 || false,
      numElemsShown: node.numElemsShown,
      isShowNElements: node.isShowNElements,
      dynamicFunction: Field.isField(node.tag) ? void 0 : (node.tag as TabControlData)
    };
  }

  static getDraggableConfig(element: any): DraggableConfig | undefined {
    const dragComponent: any | undefined = element.__vue__;
    return dragComponent?.componentData;
  }

  static isFromFilterSection(event: DragCustomEvent) {
    const { group, groupIndex } = this.getFilterGroupInfo(event.from);
    return !!group && isNumber(groupIndex);
  }

  // Get group and group index from CustomEvent Of vue draggable
  static getFilterGroupInfo(component: Element & any): { group?: ConditionTreeNode[]; groupIndex?: number } {
    const fromDraggableConfig = component.__vue__;
    return fromDraggableConfig?.componentData ?? {};
  }

  static toFunctionNode(conditionNode: ConditionTreeNode, config: DraggableConfig, enableSorting: boolean) {
    // TODO
    const clonedConditionNode = cloneDeep(conditionNode);
    return new FunctionNodeBuilder(clonedConditionNode as any, config)
      .withRandomId()
      .withSortInfo(enableSorting)
      .withForceCreateFunctionFamily()
      .build();
  }

  static replaceDynamicFunction(tblColumn: TableColumn, functions: Map<WidgetId, TableColumn[]>): TableColumn {
    const hasDynamicFunction = tblColumn.dynamicFunctionId !== undefined && tblColumn.dynamicFunctionId !== null;
    if (hasDynamicFunction && functions.has(tblColumn.dynamicFunctionId!)) {
      const columnsToReplace = functions.get(tblColumn.dynamicFunctionId!) ?? [];
      return columnsToReplace[0];
    } else {
      return tblColumn;
    }
  }

  ///Replace column có dynamic function = giá trị mới
  ///Những có column nào đã đc replace rồi thì sẽ xoá đi
  ///Ví dụ
  ///Input: tblColumns:: [none, 942, none , none, 942, 942, 123]; dynamicFunctionAsMap: {942: [column 1, column 2]}
  ///Output: tblColumns:: [none, column 1, column 2, none , none, 123] (942 replace = [column 1, column 2])
  static replaceDynamicFunctions(tblColumns: TableColumn[], dynamicFunctionAsMap: Map<WidgetId, TableColumn[]>): TableColumn[] {
    Log.debug('replaceDynamicFunctions::tblColumns', tblColumns);
    Log.debug('replaceDynamicFunctions::dynamicFunctionAsMap', dynamicFunctionAsMap);
    const idsReplaced: Set<WidgetId> = new Set(); ///Danh sách những ID đã được replace rồi
    const res = tblColumns
      .map(tblColumn => {
        ///Check xem có phải dynamic function không
        const isDynamicFunction = tblColumn.dynamicFunctionId !== undefined && tblColumn.dynamicFunctionId !== null;
        ///Check xem có dynamic function cần replace (942)
        const existDynamicFunction = isDynamicFunction ? dynamicFunctionAsMap.has(tblColumn.dynamicFunctionId!) : false;
        ///Check xem đã replace chưa
        const isReplaced = isDynamicFunction ? idsReplaced.has(tblColumn.dynamicFunctionId!) : false;
        if (!isDynamicFunction) {
          return tblColumn;
        }
        if (isReplaced) {
          return [];
        }
        if (existDynamicFunction) {
          idsReplaced.add(tblColumn.dynamicFunctionId!);
          return dynamicFunctionAsMap.get(tblColumn.dynamicFunctionId!)!;
        }
        return tblColumn;
      })
      .flat();
    Log.debug('replaceDynamicFunctions::res', res);
    return res;
  }

  static getValueConditions(conditions: Condition[], result: ValueCondition[]): ValueCondition[] {
    if (ListUtils.isEmpty(conditions)) {
      return result;
    }
    const head = conditions[0];
    const rest = conditions.slice(1);
    if (NestedCondition.isNestedCondition(head)) {
      return this.getValueConditions(head.getConditions().concat(rest), result);
    } else if (FieldRelatedCondition.isFieldRelatedCondition(head) && ValueCondition.isValueCondition(head)) {
      result.push(head);
    }
    return this.getValueConditions(rest, result);
  }
}
