import { Spin, Typography } from 'antd';
import type { CsvColumn, CsvPreview } from '@/core/ingestion/CsvImport';
import { CsvColumnHeader } from './CsvColumnHeader';

export interface CsvColumnEdit {
  readonly errors: readonly (string | undefined)[];
  readonly nullCounts: readonly number[];
  readonly onRename: (index: number, name: string) => void;
  readonly onTypeChange: (index: number, type: string) => void;
}

interface CsvPreviewTableProps {
  columns: readonly CsvColumn[];
  records: CsvPreview['records'];
  edit: CsvColumnEdit;
  isLoading: boolean;
}

const BORDER = 'border-0 border-b border-solid border-[var(--ant-color-border-secondary,#f0f0f0)]';
const HEAD_CELL = `sticky top-0 z-10 bg-[var(--ant-color-fill-alter,#fafafa)] p-2 text-left align-top ${BORDER}`;
const CELL = `max-w-44 truncate px-2 py-1 ${BORDER}`;

function displayValue(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/**
 * The preview rows as the server would insert them, each column with its name and type to edit above. A plain table:
 * antd's renders the headers a second time, hidden but focusable, to measure them once the table scrolls.
 */
export function CsvPreviewTable({ columns, records, edit, isLoading }: CsvPreviewTableProps) {
  return (
    <Spin spinning={isLoading}>
      <div className="max-h-[420px] overflow-auto rounded border border-solid border-[var(--ant-color-border-secondary,#f0f0f0)]">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${HEAD_CELL} w-10`}>#</th>
              {columns.map((column, index) => (
                <th key={index} className={`${HEAD_CELL} w-44 min-w-44`}>
                  <CsvColumnHeader
                    position={index + 1}
                    column={column}
                    error={edit.errors[index]}
                    nullCount={edit.nullCounts[index] ?? 0}
                    disabled={isLoading}
                    onRename={name => edit.onRename(index, name)}
                    onTypeChange={type => edit.onTypeChange(index, type)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, row) => (
              <tr key={row}>
                <td className={CELL}>{row + 1}</td>
                {columns.map((_, index) => {
                  const value = record[index];
                  return value == null ? (
                    <td key={index} className={CELL}>
                      <Typography.Text type="secondary" italic>
                        null
                      </Typography.Text>
                    </td>
                  ) : (
                    <td key={index} className={CELL} title={displayValue(value)}>
                      {displayValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Spin>
  );
}
