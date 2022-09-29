/*
 * @author: tvc12 - Thien Vi
 * @created: 11/30/20, 11:48 AM
 */

import { ConfigType, FunctionData, FunctionFamilyTypes } from '@/shared';
import { DynamicFunction, Equal, FieldRelatedFunction, OrderBy, TableColumn } from '@core/common/domain/model';
import { ListUtils } from '@/utils/ListUtils';
import { DIException } from '@core/common/domain/exception';
import { ChartUtils } from '@/utils/ChartUtils';
import { FunctionResolver } from '@core/common/services/function-builder/FunctionResolver';
import { Inject } from 'typescript-ioc';
import { ConditionUtils } from '@core/utils';
import { RowData } from '@/shared/models';
import { compact } from 'lodash';

export abstract class QuerySettingUtils {
  @Inject
  static readonly functionBuilder: FunctionResolver;

  static buildTableColumn(configsAsMap: Map<ConfigType, FunctionData[]>, configType: ConfigType, isRequired = true): TableColumn {
    const functionData: FunctionData[] = configsAsMap.get(configType) ?? [];
    if (ListUtils.isEmpty(functionData) && isRequired) {
      throw new DIException(`getTableColumn:: ${configType} must be not empty`);
    }
    return ChartUtils.buildTableColumnsFromFunctionData(functionData)[0];
  }

  static buildListTableColumn(configsAsMap: Map<ConfigType, FunctionData[]>, configType: ConfigType, isRequired = true): TableColumn[] {
    const functionData: FunctionData[] = configsAsMap.get(configType) ?? [];
    if (ListUtils.isEmpty(functionData) && isRequired) {
      throw new DIException(`getTableColumn:: ${configType} must be not empty`);
    }
    return ChartUtils.buildTableColumnsFromFunctionData(functionData);
  }

  static buildOrderBy(functionData: FunctionData): OrderBy[] {
    if (functionData.dynamicFunction) {
      const functions = functionData.dynamicFunction.defaultTableColumns.map(tblColumn => TableColumn.fromObject(tblColumn).function);
      return compact(
        functions.map(fnc => {
          const dynamicFnc = new DynamicFunction(functionData.dynamicFunction!.id, fnc, fnc);
          return ChartUtils.buildOrderFunction(dynamicFnc, functionData.sorting, functionData.isShowNElements, functionData.numElemsShown) as OrderBy;
        })
      );
    } else {
      const func = this.functionBuilder.buildFunction(functionData) as FieldRelatedFunction;
      return compact([ChartUtils.buildOrderFunction(func, functionData.sorting, functionData.isShowNElements, functionData.numElemsShown) as OrderBy]);
    }
  }

  static buildListOrderBy(mapFunctionData: Map<ConfigType, FunctionData[]>): OrderBy[] {
    const sortedFunctions: FunctionData[] = this.getSortedFunctions(mapFunctionData);
    const aggregationFuncWithoutSort: FunctionData[] = this.getAggregationFunctions(mapFunctionData, [ConfigType.sorting]);
    const allFunctions = sortedFunctions.concat(aggregationFuncWithoutSort);
    return this.toOrderByList(allFunctions);
  }

  private static getSortedFunctions(mapFunctionData: Map<ConfigType, FunctionData[]>): FunctionData[] {
    return mapFunctionData.get(ConfigType.sorting) ?? [];
  }

  private static getAggregationFunctions(mapFunctionData: Map<ConfigType, FunctionData[]>, listConfigIgnored: ConfigType[]): FunctionData[] {
    const results: FunctionData[] = [];
    const ignoreConfigAsSet = new Set(listConfigIgnored);
    mapFunctionData.forEach((listFunctionData: FunctionData[], configType) => {
      if (!ignoreConfigAsSet.has(configType)) {
        const listAggregationFunction = this.chooseAggregationHasSorting(listFunctionData);
        results.push(...listAggregationFunction);
      }
    });

    return results;
  }

  private static chooseAggregationHasSorting(listFunctionData: FunctionData[]): FunctionData[] {
    return listFunctionData.filter(data => data.functionFamily == FunctionFamilyTypes.aggregation);
  }

  private static toOrderByList(allFunctions: FunctionData[]): OrderBy[] {
    return allFunctions
      .map(funData => this.buildOrderBy(funData))
      .flat()
      .filter((orderBy): orderBy is OrderBy => !!orderBy);
  }

  static buildEqualConditions(tableColumns: TableColumn[], currentRow: RowData, valueKey: string): Equal[] {
    let node: RowData | undefined = currentRow;
    const equals = [];
    while (true) {
      if (!node) {
        break;
      }
      const parentIndex = node.depth ?? 0;
      const tableColumn = tableColumns[parentIndex];
      const equal = ConditionUtils.buildEqualCondition(tableColumn, node[valueKey] ?? '');
      node = node.parent;
      equals.push(equal);
    }
    return equals;
  }
}
