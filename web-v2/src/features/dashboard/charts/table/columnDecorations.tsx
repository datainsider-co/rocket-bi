import type { CSSProperties, ReactNode } from 'react';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import type { MinMaxValue, TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import type { CellNumberFormat } from './table.utils';
import { TableCellContent } from './TableCellContent';
import {
  cellColor,
  columnRangeOf,
  conditionalFormattingOf,
  dataBarOf,
  fieldCellStyle,
  fieldFormattingOf,
  fieldNumberFormat,
  matchRule,
  ownCellFormatting,
  rulesOf
} from './tableFormatting.utils';

/** How one column looks beyond the table's style: its number format, header and cell styles, data bar and icon. */
export interface ColumnDecoration {
  format: CellNumberFormat;
  headerStyle?: CSSProperties;
  cellStyle?: (value: unknown) => CSSProperties | undefined;
  render?: (value: unknown, text: string) => ReactNode;
}

export type DecorateColumn = (header: TableHeader) => ColumnDecoration;

interface DecorationInput {
  options: VizOptions;
  /** The query's columns (`table_chart_setting.columns`); a header's key is its column's position. */
  columns: readonly unknown[];
  minMaxValues?: readonly MinMaxValue[];
}

/** The decoration of each column from the table's field formatting and conditional formatting. */
export function columnDecorationsOf({ options, columns, minMaxValues }: DecorationInput): DecorateColumn {
  return header => {
    const field = asRecord(asRecord(columns[Number(header.key)])['function'])['field'];
    const range = columnRangeOf(minMaxValues, header.label);
    const own = fieldFormattingOf(options, header.label);
    const conditional = conditionalFormattingOf(options, header.label);
    const background = ownCellFormatting(conditional, 'backgroundColor', field);
    const color = ownCellFormatting(conditional, 'color', field);
    const icon = ownCellFormatting(conditional, 'icon', field);
    const dataBar = asRecord(conditional?.['dataBar']);
    const valueStyle = fieldCellStyle(own, 'values');
    const hasCellStyle = valueStyle || background || color;
    const hasContent = icon || dataBar['enabled'] === true;
    return {
      format: fieldNumberFormat(options, header.label),
      headerStyle: fieldCellStyle(own, 'header'),
      ...(hasCellStyle && {
        cellStyle: (value: unknown) => {
          const backgroundColor = background && cellColor(value, background, range);
          const textColor = color && cellColor(value, color, range);
          return { ...valueStyle, ...(backgroundColor && { backgroundColor }), ...(textColor && { color: textColor }) };
        }
      }),
      ...(hasContent && {
        render: (value: unknown, text: string) => {
          const iconText = icon && matchRule(value, rulesOf(icon, 'icon'), range);
          return (
            <TableCellContent
              text={text}
              bar={dataBarOf(value, dataBar, range)}
              icon={icon && iconText ? { icon: iconText, layout: asString(icon['layout'], 'left'), align: asString(icon['align'], 'center') } : undefined}
            />
          );
        }
      })
    };
  };
}

/** The query's columns of a table setting. */
export function tableColumnsOf(setting: JsonObject): unknown[] {
  return asArray(setting['columns']);
}
