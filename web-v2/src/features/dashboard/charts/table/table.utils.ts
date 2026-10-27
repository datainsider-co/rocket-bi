import type { TableColumnsType } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { JsonObject } from '@/core/json/json';
import type { TableSort } from '@/core/query/tableSort';
import type { TableHeader } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat, DisplayUnit } from '../numberFormat';

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
}

/**
 * Header tree → antd columns; leaves read the record cell under the header's key. Numbers align right, as in v1.
 * Leaves sort on the server; `sort` marks the sorted one.
 */
export function toColumns(headers: readonly TableHeader[], sort?: TableSort, format: CellNumberFormat = String): TableColumnsType<TableRow> {
  return headers.map(header =>
    header.children.length > 0
      ? { key: header.key, title: header.label, children: toColumns(header.children, sort, format) }
      : {
          key: header.key,
          title: header.label,
          dataIndex: ['record', header.key],
          align: header.isTextLeft ? 'left' : 'right',
          ellipsis: true,
          sorter: true,
          sortOrder: sort?.column === header.label ? (sort.direction === 'ASC' ? 'ascend' : 'descend') : null,
          render: (value: unknown) => tableCellText(value, header, format)
        }
  );
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
