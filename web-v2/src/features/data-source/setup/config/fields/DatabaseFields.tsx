import { Input } from 'antd';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';
import { HostPortFields } from './HostPortFields';

/** PostgreSQL and Redshift (v1 `PostgreSQLConnectorForm`, `RedshiftConnectorForm`): host, port, credentials, database. */
function databaseFields(defaultPort: string) {
  return function DatabaseFields({ control }: ConnectionFieldsProps) {
    return (
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <HostPortFields control={control} defaultPort={defaultPort} />
        <FormField
          control={control}
          name="database"
          label="Database"
          required
          render={field => <Input {...field} autoComplete="off" placeholder="Input database" />}
        />
      </div>
    );
  };
}

export const PostgreSqlFields = databaseFields('5432');
export const RedshiftFields = databaseFields('5439');
