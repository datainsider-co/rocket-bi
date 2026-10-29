import { Input, Select, Typography } from 'antd';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import { columnTypeLabel, CSV_COLUMN_TYPES } from './csvColumns.utils';

interface CsvColumnHeaderProps {
  /** 1-based, for the labels. */
  position: number;
  column: CsvColumn;
  error: string | undefined;
  /** Preview rows where the value is empty or didn't convert to the type. */
  nullCount: number;
  disabled: boolean;
  onRename: (name: string) => void;
  onTypeChange: (type: string) => void;
}

function typeOptions(type: string) {
  const options: { value: string; label: string }[] = CSV_COLUMN_TYPES.map(({ value, label }) => ({ value, label }));
  return options.some(option => option.value === type) ? options : [...options, { value: type, label: columnTypeLabel(type) }];
}

/**
 * A column's name and type above its preview values. The server turns a value that doesn't fit the type into NULL
 * without telling (DI0), so the count of empty values shows it before the upload.
 */
export function CsvColumnHeader({ position, column, error, nullCount, disabled, onRename, onTypeChange }: CsvColumnHeaderProps) {
  return (
    <div className="flex flex-col gap-1 font-normal">
      <Input
        size="small"
        aria-label={`Column ${position} name`}
        value={column.name}
        status={error ? 'error' : undefined}
        disabled={disabled}
        onChange={event => onRename(event.target.value)}
      />
      <Select
        size="small"
        aria-label={`Column ${position} type`}
        value={column.type}
        options={typeOptions(column.type)}
        disabled={disabled}
        onChange={onTypeChange}
      />
      {error ? (
        <Typography.Text type="danger" className="text-xs">
          {error}
        </Typography.Text>
      ) : (
        <Typography.Text type={nullCount > 0 ? 'warning' : 'secondary'} className="text-xs">
          {nullCount > 0 ? `${nullCount} empty` : 'No empty values'}
        </Typography.Text>
      )}
    </div>
  );
}
