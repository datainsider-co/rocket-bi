import { Input, Select } from 'antd';
import { BIGQUERY_LOCATIONS } from '@/core/connection/bigQueryLocations';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';

const LOCATION_OPTIONS = BIGQUERY_LOCATIONS.map(({ value, label }) => ({ value, label }));

/** v1 `BigQueryConnectorForm`: the service account key, the project and the dataset location. */
export function BigQueryFields({ control }: ConnectionFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="credentials"
        label="Credentials"
        required
        render={field => (
          <Input.TextArea
            {...field}
            autoComplete="off"
            spellCheck={false}
            autoSize={{ minRows: 4, maxRows: 10 }}
            className="font-mono"
            placeholder="Paste the service account key (JSON)"
          />
        )}
      />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="projectId"
          label="Project ID"
          required
          render={field => <Input {...field} autoComplete="off" placeholder="ex: datainsider-project" />}
        />
        <FormField
          control={control}
          name="location"
          label="Location"
          required
          render={({ value, onChange, onBlur, ref, id }) => (
            <Select
              id={id}
              ref={ref}
              value={value || undefined}
              onChange={onChange}
              onBlur={onBlur}
              showSearch={{ optionFilterProp: 'label' }}
              options={LOCATION_OPTIONS}
              placeholder="Choose location"
            />
          )}
        />
      </div>
    </>
  );
}
