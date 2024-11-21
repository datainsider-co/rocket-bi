/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 3:03 PM
 */

import {
  AbstractTableResponse,
  ColorFormatting,
  ConditionalFormatting,
  ConditionalFormattingData,
  FieldRelatedFunction,
  Function,
  FunctionType,
  IconFormatting,
  MinMaxData,
  TableColumn,
  ValueColorFormatting,
  ValueColorFormattingType
} from '@core/common/domain';
import { Log } from '@core/utils/Log';
import { HeaderData, IndexedHeaderData } from '@/shared/models';
import { StringUtils } from '@/utils/StringUtils';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { ChartUtils, ListUtils } from '@/utils';
import { NumberUtils } from '@core/utils/NumberUtils';

export enum FormatHeaderType {
  BackgroundColor = 'background',
  Color = 'color',
  Icon = 'icon'
}

export class ConditionalFormattingUtils {
  static buildTableColumns(conditionalFormatting: ConditionalFormatting): TableColumn[] {
    return Object.entries(conditionalFormatting)
      .filter(([key, value]) => !!value)
      .flatMap(([key, value]) => {
        return [
          ConditionalFormattingUtils.createTableColumn(StringUtils.toCamelCase(`${value.label} - background`), `${key}_background`, value.backgroundColor),
          ConditionalFormattingUtils.createTableColumn(StringUtils.toCamelCase(`${value.label} - color`), `${key}_color`, value.color),
          ConditionalFormattingUtils.createTableColumn(StringUtils.toCamelCase(`${value.label} - icon`), `${key}_icon`, value.icon)
        ].filter((table): table is TableColumn => !!table);
      });
  }

  static findConditionFormattingData(
    conditionalFormatting: ConditionalFormatting | undefined | null,
    header: IndexedHeaderData
  ): ConditionalFormattingData | undefined {
    return ConditionalFormattingUtils.findConditionFormattingDataByName(conditionalFormatting, header.label);
  }

  static findConditionFormattingDataByName(
    conditionalFormatting: ConditionalFormatting | undefined | null,
    name: string
  ): ConditionalFormattingData | undefined {
    if (conditionalFormatting) {
      const headerKey: string = StringUtils.toCamelCase(name);
      // hardcode: fix auto add by in column
      const normalizedKey = ListUtils.getHead(headerKey.split('By')) ?? '';
      return conditionalFormatting[headerKey] ?? ObjectUtils.findStartWithKey(conditionalFormatting, normalizedKey);
    }
  }

  static findTableHeaderForFormatting(
    formattingData: ConditionalFormattingData,
    tableResponse: AbstractTableResponse,
    formatHeaderType: FormatHeaderType
  ): HeaderData | undefined {
    const normalizeKey = StringUtils.toCamelCase(formattingData.label ?? '');
    const key = `${normalizeKey}_${formatHeaderType}`;
    return tableResponse.headers.find((header: HeaderData) => header.formatterKey === key);
  }

  static findMinMaxData(tableResponse: AbstractTableResponse, header: HeaderData): MinMaxData {
    const headerName: string = StringUtils.toCamelCase(header.label);
    return tableResponse.minMaxValues.find(minMaxData => {
      const normalizedValueName = StringUtils.toCamelCase(minMaxData.valueName);
      const isMatching = normalizedValueName === headerName;
      const isContainHeaderName = StringUtils.isIncludes(normalizedValueName, headerName);
      return isMatching || isContainHeaderName;
    })!;
  }

  static findDataBarMinMax(tableResponse: AbstractTableResponse, headerName: string): MinMaxData {
    return tableResponse.minMaxValues.find(minMaxData => {
      return minMaxData.valueName === headerName;
    })!;
  }

  static findPivotHeaderFormatter(
    formattingData: ConditionalFormattingData,
    header: IndexedHeaderData,
    formatHeaderType: FormatHeaderType
  ): HeaderData | undefined {
    if (header.parent && ListUtils.isNotEmpty(header.parent.formatters)) {
      const formatters = header.parent.formatters ?? [];
      return this.findHeaderFormatterMatching(formatters, formattingData, formatHeaderType);
    }
  }

  static getValueFormatting(valueColorFormatting: ValueColorFormatting, defaultValue: number): number {
    if (NumberUtils.isNumber(valueColorFormatting.value)) {
      switch (valueColorFormatting.type) {
        case ValueColorFormattingType.Custom:
          return NumberUtils.toNumber(valueColorFormatting.value);
        default:
          return defaultValue;
      }
    } else {
      return defaultValue;
    }
  }

  private static createTableColumn(name: string, key: string, formattingData: ColorFormatting | IconFormatting | undefined): TableColumn | undefined {
    if (formattingData && formattingData.enabled && formattingData.summarization) {
      try {
        const functionAsObject = {
          field: formattingData.baseOnField!,
          className: formattingData.summarization!
        } as any;
        const relatedFunction: FieldRelatedFunction = Function.fromObject(functionAsObject) as FieldRelatedFunction;
        const isMinMaxOn = ConditionalFormattingUtils.canEnableMinMax(relatedFunction);
        const isCalcGroupTotal = isMinMaxOn;
        return new TableColumn(name, relatedFunction, false, false, isCalcGroupTotal, isMinMaxOn, key);
      } catch (ex) {
        Log.error('createTableColumn::name', name, 'key', key, 'formattingData::', formattingData, 'ex', ex);
      }
    }
  }

  private static findHeaderFormatterMatching(
    formatters: HeaderData[],
    formattingData: ConditionalFormattingData,
    formatHeaderType: FormatHeaderType
  ): HeaderData | undefined {
    const normalizeKey = StringUtils.toCamelCase(formattingData.label ?? '');
    const key = `${normalizeKey}_${formatHeaderType}`;
    return formatters.find((header: HeaderData) => header.formatterKey === key);
  }

  private static canEnableMinMax(relatedFunction: FieldRelatedFunction) {
    switch (relatedFunction.className) {
      case FunctionType.Last:
      case FunctionType.First:
        return false;
      default:
        return ChartUtils.isNumberType(relatedFunction.field.fieldType) || ChartUtils.isAggregationFunction(relatedFunction);
    }
  }
}
