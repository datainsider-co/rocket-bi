import type { HTMLAttributes } from 'react';
import type { TableColumnsType } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import type { TableSort } from '@/core/query/tableSort';
import type { TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import type { DecorateColumn } from './columnDecorations';
import { createNumberFormat, DisplayUnit } from '../numberFormat';
import { columnOfLabel, isCollapseTableSetting } from './collapseTable.utils';

/** Formats a number cell. */
export type CellNumberFormat = (value: number) => string;

/**
 * The table's number format from its viz options (v1 `TableController.getBodyFormatter` without per-field formatting):
 * the general display unit (none by default), precision, decimal point and thousand separator.
 */
export function tableNumberFormat(options: VizOptions): CellNumberFormat {
  const table = options.plotOptions as { table?: { dataLabels?: { displayUnit?: string } } } | undefined;
  return createNumberFormat({
    displayUnit: table?.table?.dataLabels?.displayUnit ?? DisplayUnit.None,
    precision: typeof options.precision === 'number' ? options.precision : undefined,
    decimalPoint: typeof options.decimalPoint === 'string' ? options.decimalPoint : undefined,
    thousandSep: typeof options.thousandSep === 'string' ? options.thousandSep : undefined
  });
}

/**
 * A cell's text (v1 `getBodyFormatter`): `--` when empty, numbers formatted unless the column is text or a group by,
 * anything that isn't a number as is.
 */
export function tableCellText(value: unknown, header: Pick<TableHeader, 'isTextLeft' | 'isGroupBy'>, format: CellNumberFormat): string {
  if (value === null || value === undefined) return '--';
  if (header.isTextLeft || header.isGroupBy) return String(value);
  const number = typeof value === 'number' ? value : Number(value);
  return typeof value === 'boolean' || value === '' || Number.isNaN(number) ? String(value) : format(number);
}

/** A record with a React key; the record's own keys are header keys from the server, so the key sits beside it. */
export interface TableRow {
  key: string;
  record: JsonObject;
  /** A collapse table's next group, shown when the row is expanded. */
  children?: TableRow[];
}

/** Gives a cell its full text, for its tooltip (`TooltipCell`). */
function titled(title: string): HTMLAttributes<HTMLElement> {
  return { 'data-title': title } as HTMLAttributes<HTMLElement>;
}

/**
 * Header tree → antd columns; leaves read the record cell under the header's key. Numbers align right, as in v1
 * (headers align by the table's options). Leaves sort on the server; `sort` marks the sorted one. Each cell carries its
 * full text for its tooltip.
 */
export function toColumns(headers: readonly TableHeader[], sort?: TableSort, format: CellNumberFormat = String, decorate?: DecorateColumn): TableColumnsType<TableRow> {
  return headers.map(header => {
    if (header.children.length > 0) {
      return { key: header.key, title: header.label, onHeaderCell: () => titled(header.label), children: toColumns(header.children, sort, format, decorate) };
    }
    const decoration = decorate?.(header);
    const cellFormat = decoration?.format ?? format;
    return {
      key: header.key,
      title: header.label,
      dataIndex: ['record', header.key],
      align: header.isTextLeft ? 'left' : 'right',
      ellipsis: { showTitle: false },
      onHeaderCell: () => ({ ...titled(header.label), style: decoration?.headerStyle }),
      onCell: (row: TableRow) => {
        const value = row.record[header.key];
        return { ...titled(tableCellText(value, header, cellFormat)), style: decoration?.cellStyle?.(value) };
      },
      sorter: true,
      sortOrder: sort?.column === header.label ? (sort.direction === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: unknown) => {
        const text = tableCellText(value, header, cellFormat);
        return decoration?.render ? decoration.render(value, text) : text;
      }
    };
  });
}

/** antd's sorter → the sort to query with; none when the column went back to unsorted. */
export function toTableSort(sorter: SorterResult<TableRow> | SorterResult<TableRow>[]): TableSort | undefined {
  const single = Array.isArray(sorter) ? sorter[0] : sorter;
  const title = single?.column?.title;
  if (!single?.order || typeof title !== 'string') return undefined;
  return { column: title, direction: single.order === 'ascend' ? 'ASC' : 'DESC' };
}

/** Rows have no id; their position in the whole table is enough for React. */
export function toRows(records: readonly JsonObject[], from: number): TableRow[] {
  return records.map((record, index) => ({ key: String(from + index), record }));
}

/** The query column a header shows, and the name its formatting is keyed by. */
export interface HeaderColumn {
  readonly name: string;
  readonly column: JsonObject;
}

export type HeaderColumnOf = (header: TableHeader) => HeaderColumn;

/**
 * The query column of each header: by position in a flatten table, whose header keys are the columns' indexes; by name
 * in a collapse table, whose keys are hashes and whose labels can read `<name> by ...`.
 */
export function headerColumnOf(setting: JsonObject): HeaderColumnOf {
  const columns = asArray(setting['columns']);
  if (!isCollapseTableSetting(setting)) return header => ({ name: header.label, column: asRecord(columns[Number(header.key)]) });
  return header => {
    const column = columnOfLabel(columns, header.label);
    return column ? { name: asString(column['name']), column } : { name: header.label, column: {} };
  };
}
