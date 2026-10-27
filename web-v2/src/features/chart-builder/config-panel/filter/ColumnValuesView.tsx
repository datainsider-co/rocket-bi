import { Button, Checkbox, Spin } from 'antd';
import { shownValues } from './columnValues.utils';
import type { ColumnValues } from './useColumnValues';

interface ColumnValuesViewProps {
  source: ColumnValues;
  picked: readonly string[];
  onChange: (values: string[]) => void;
}

/** The column's values to tick (v1 `SelectionFilter` list), loading more on demand. */
export function ColumnValuesView({ source, picked, onChange }: ColumnValuesViewProps) {
  if (source.status === 'loading') return <Spin className="block py-4" />;
  if (source.status === 'error') {
    return (
      <div className="flex items-center gap-2 text-[var(--ant-color-error,#ff4d4f)]">
        Cannot load the values
        <Button size="small" onClick={source.retry}>
          Retry
        </Button>
      </div>
    );
  }
  const values = shownValues(source.values, picked);
  if (values.length === 0) return <p className="m-0 text-black/45">No values</p>;
  return (
    <fieldset className="m-0 max-h-72 min-w-0 overflow-auto border-0 p-0" aria-label="Values">
      <Checkbox.Group className="flex flex-col gap-1" value={[...picked]} options={values.map(value => ({ value, label: value }))} onChange={onChange} />
      {source.hasMore && (
        <Button type="link" size="small" className="px-0" loading={source.loadingMore} onClick={source.loadMore}>
          Load more
        </Button>
      )}
    </fieldset>
  );
}
