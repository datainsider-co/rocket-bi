import type { TableColumnsType } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { JsonObject } from '@/core/json/json';
import type { TableSort } from '@/core/query/tableSort';
import type { TableHeader } from '@/core/query/VisualizationResponse';

/** A record with a React key; the record's own keys are header keys from the server, so the key sits beside it. */
export interface TableRow {
  key: string;
  record: JsonObject;
}

/**
 * Header tree → antd columns; leaves read the record cell under the header's key. Numbers align right, as in v1.
 * Leaves sort on the server; `sort` marks the sorted one.
 */
export function toColumns(headers: readonly TableHeader[], sort?: TableSort): TableColumnsType<TableRow> {
  return headers.map(header =>
    header.children.length > 0
      ? { key: header.key, title: header.label, children: toColumns(header.children, sort) }
      : {
          key: header.key,
          title: header.label,
          dataIndex: ['record', header.key],
          align: header.isTextLeft ? 'left' : 'right',
          ellipsis: true,
          sorter: true,
          sortOrder: sort?.column === header.label ? (sort.direction === 'ASC' ? 'ascend' : 'descend') : null,
          render: (value: unknown) => (value === null || value === undefined ? '' : String(value))
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
