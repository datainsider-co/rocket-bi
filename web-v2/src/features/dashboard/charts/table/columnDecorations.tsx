import type { CSSProperties, ReactNode } from 'react';
import { asRecord, asString } from '@/core/json/json';
import type { MinMaxValue, TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import type { CellNumberFormat, HeaderColumnOf } from './table.utils';
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
  /** The query column of a header (`headerColumnOf`). */
  columnOf: HeaderColumnOf;
  minMaxValues?: readonly MinMaxValue[];
}

/** The decoration of each column from the table's field formatting and conditional formatting. */
export function columnDecorationsOf({ options, columnOf, minMaxValues }: DecorationInput): DecorateColumn {
  return header => {
    const { name, column } = columnOf(header);
    const field = asRecord(column['function'])['field'];
    const range = columnRangeOf(minMaxValues, name);
    const own = fieldFormattingOf(options, name);
    const conditional = conditionalFormattingOf(options, name);
    const background = ownCellFormatting(conditional, 'backgroundColor', field);
    const color = ownCellFormatting(conditional, 'color', field);
    const icon = ownCellFormatting(conditional, 'icon', field);
    const dataBar = asRecord(conditional?.['dataBar']);
    const valueStyle = fieldCellStyle(own, 'values');
    const hasCellStyle = valueStyle || background || color;
    const hasContent = icon || dataBar['enabled'] === true;
    return {
      format: fieldNumberFormat(options, name),
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
