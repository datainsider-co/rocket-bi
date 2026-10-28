import { Input, Radio } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import { SyncMode } from '@/core/ingestion/Job';
import { FormField } from '@/shared/form/FormField';
import type { JobFormValues } from './jobForm.utils';
import { NameInput } from './NameInput';
import type { Suggestions } from './useJobFormOptions';

const SYNC_MODES = [
  { value: SyncMode.FullSync, label: 'Full sync' },
  { value: SyncMode.IncrementalSync, label: 'Incremental sync' }
];

/**
 * v1 `JdbcSyncModeConfig`: full sync, or incremental from a column and a start value. Columns are suggested for a
 * single table; with several the column is typed and must exist in each.
 */
export function JobSyncSection({ columns }: { columns: Suggestions }) {
  const { control } = useFormContext<JobFormValues>();
  const syncMode = useWatch({ control, name: 'syncMode' });

  return (
    <section aria-label="Sync mode">
      <FormField
        control={control}
        name="syncMode"
        label="Sync mode"
        render={field => <Radio.Group {...field} options={SYNC_MODES} />}
      />
      {syncMode === SyncMode.IncrementalSync && (
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="incrementalColumn"
            label="Incremental column"
            required
            render={({ value, onChange, onBlur, id }) => (
              <NameInput
                id={id}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                suggestions={columns}
                placeholder="Input incremental column"
              />
            )}
          />
          <FormField
            control={control}
            name="lastSyncedValue"
            label="Start value"
            required
            render={field => <Input {...field} autoComplete="off" placeholder="Input start value" />}
          />
        </div>
      )}
    </section>
  );
}
