import { Typography } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { JobFormValues } from './jobForm.utils';
import { NameInput } from './NameInput';
import type { JobFormOptions } from './useJobFormOptions';

interface JobDestinationSectionProps {
  options: Pick<JobFormOptions, 'destDatabases' | 'destTables'>;
  /** Tables picked; with more than one, each job writes to a table named like its source table. */
  tableCount: number;
}

/**
 * Where the job writes (v1 `JobWareHouseConfig`): a warehouse database, listed or new, and a table. v1 created a new
 * database before saving; the job's first sync creates it, so a typed name is enough.
 */
export function JobDestinationSection({ options, tableCount }: JobDestinationSectionProps) {
  const { control } = useFormContext<JobFormValues>();
  const destDatabaseName = useWatch({ control, name: 'destDatabaseName' }).trim();
  const isNew =
    destDatabaseName !== '' && !options.destDatabases.isLoading && !options.destDatabases.names.includes(destDatabaseName);

  return (
    <section aria-label="Destination">
      <FormField
        control={control}
        name="destDatabaseName"
        label="To database"
        required
        render={({ value, onChange, onBlur, id }) => (
          <NameInput
            id={id}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            suggestions={options.destDatabases}
            placeholder="Select a database or type a new name"
          />
        )}
      />
      {isNew && (
        <Typography.Paragraph type="secondary" className="-mt-4 text-xs">
          New database: the first sync creates it.
        </Typography.Paragraph>
      )}
      {tableCount <= 1 ? (
        <FormField
          control={control}
          name="destTableName"
          label="To table"
          required
          render={({ value, onChange, onBlur, id }) => (
            <NameInput
              id={id}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              suggestions={options.destTables}
              placeholder="Select a table or type a new name"
            />
          )}
        />
      ) : (
        <Typography.Paragraph type="secondary">Each table syncs to a table of the same name.</Typography.Paragraph>
      )}
    </section>
  );
}
