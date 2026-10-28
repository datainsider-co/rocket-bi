import { Button, Select } from 'antd';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { followDestTableName, type JobFormValues } from './jobForm.utils';
import { NameInput } from './NameInput';
import type { JobFormOptions } from './useJobFormOptions';

interface JobSourceSectionProps {
  options: Pick<JobFormOptions, 'sources' | 'databases' | 'tables'>;
  /** The source can't be changed (the form was opened from it). */
  lockSource: boolean;
  /** Several tables can be picked, one job each (creating only). */
  allowMultiTable: boolean;
}

/**
 * Where the job reads from (v1 `DataSourceConfig` and `JdbcFromDatabaseSuggestion`): source, database, table(s).
 * Changing the source or the database clears what was picked under it; the destination table follows the source table.
 */
export function JobSourceSection({ options, lockSource, allowMultiTable }: JobSourceSectionProps) {
  const { control, getValues, setValue } = useFormContext<JobFormValues>();
  const { sources, databases, tables } = options;

  const changeTables = (next: string[]) => {
    setValue('destTableName', followDestTableName(getValues('tableNames'), next, getValues('destTableName')));
    setValue('tableNames', next, { shouldValidate: getValues('tableNames').length > 0 });
  };

  return (
    <section aria-label="Source">
      <FormField
        control={control}
        name="sourceId"
        label="From data source"
        required
        render={({ value, onChange, onBlur, id }) => (
          <Select
            id={id}
            value={value}
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Select data source"
            loading={sources.isLoading}
            disabled={lockSource}
            notFoundContent={sources.error}
            options={sources.items.map(source => ({ value: source.id, label: source.displayName }))}
            onBlur={onBlur}
            onChange={(next: number) => {
              onChange(next);
              setValue('databaseName', '');
              changeTables([]);
              setValue('incrementalColumn', '');
            }}
          />
        )}
      />
      <FormField
        control={control}
        name="databaseName"
        label="From database"
        required
        render={({ value, onChange, onBlur, id }) => (
          <NameInput
            id={id}
            value={value}
            onBlur={onBlur}
            suggestions={databases}
            placeholder="Select or type a database name"
            onChange={next => {
              onChange(next);
              changeTables([]);
            }}
          />
        )}
      />
      <FormField
        control={control}
        name="tableNames"
        label={allowMultiTable ? 'From tables' : 'From table'}
        required
        render={({ value, onBlur, id }) =>
          allowMultiTable ? (
            <div className="flex flex-col items-start gap-1">
              <Select
                id={id}
                mode="tags"
                className="w-full"
                value={value}
                loading={tables.isLoading}
                notFoundContent={tables.error}
                placeholder="Select tables or type their names"
                options={tables.names.map(name => ({ value: name, label: name }))}
                maxTagCount="responsive"
                onBlur={onBlur}
                onChange={changeTables}
              />
              <Button
                type="link"
                size="small"
                className="!px-0"
                disabled={tables.names.length === 0}
                onClick={() => changeTables([...tables.names])}
              >
                Select all {tables.names.length} tables
              </Button>
            </div>
          ) : (
            <NameInput
              id={id}
              value={value[0] ?? ''}
              onBlur={onBlur}
              suggestions={tables}
              placeholder="Select or type a table name"
              onChange={next => changeTables(next ? [next] : [])}
            />
          )
        }
      />
    </section>
  );
}
