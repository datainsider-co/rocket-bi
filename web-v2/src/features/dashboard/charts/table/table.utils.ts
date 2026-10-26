import type { TableColumnsType } from 'antd';
import type { JsonObject } from '@/core/json/json';
import type { TableHeader } from '@/core/query/VisualizationResponse';

/** A record with a React key; the record's own keys are header keys from the server, so the key sits beside it. */
export interface TableRow {
  key: string;
  record: JsonObject;
}

/** Header tree → antd columns; leaves read the record cell under the header's key. Numbers align right, as in v1. */
export function toColumns(headers: readonly TableHeader[]): TableColumnsType<TableRow> {
  return headers.map(header =>
    header.children.length > 0
      ? { key: header.key, title: header.label, children: toColumns(header.children) }
      : {
          key: header.key,
          title: header.label,
          dataIndex: ['record', header.key],
          align: header.isTextLeft ? 'left' : 'right',
          ellipsis: true,
          render: (value: unknown) => (value === null || value === undefined ? '' : String(value))
        }
  );
}

/** Rows have no id; their position in the whole table is enough for React. */
export function toRows(records: readonly JsonObject[], from: number): TableRow[] {
  return records.map((record, index) => ({ key: String(from + index), record }));
}
