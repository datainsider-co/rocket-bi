import { Input, Select } from 'antd';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { JdbcSourceKind } from '../sourceKinds';
import { OracleTarget } from './jdbcUrl.utils';
import { databaseLabel, type SourceFormValues } from './sourceForm.utils';

interface JdbcSourceFieldsProps {
  control: Control<SourceFormValues>;
  kind: JdbcSourceKind;
  /** Edit the JDBC URL as text instead of host and port. */
  rawUrl: boolean;
}

const ORACLE_TARGETS = [
  { value: OracleTarget.ServiceName, label: 'Service Name' },
  { value: OracleTarget.Sid, label: 'SID' }
];

/** The fields of v1's JDBC `*FormRender` classes, by kind: display name, where to connect, credentials. */
export function JdbcSourceFields({ control, kind, rawUrl }: JdbcSourceFieldsProps) {
  const oracleTarget = useWatch({ control, name: 'oracleTarget' });
  const database = databaseLabel(kind, oracleTarget);

  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormField
          control={control}
          name="displayName"
          label="Display name"
          required
          render={field => <Input {...field} autoComplete="off" placeholder="Input display name" />}
        />
      </div>
      {rawUrl ? (
        <div className="sm:col-span-2">
          <FormField
            control={control}
            name="jdbcUrl"
            label="JDBC URL"
            required
            render={field => <Input.TextArea {...field} autoSize={{ minRows: 3 }} placeholder="jdbc:<driver>://<host>:<port>/..." />}
          />
        </div>
      ) : (
        <>
          <FormField
            control={control}
            name="host"
            label="Host"
            required
            render={field => <Input {...field} autoComplete="off" placeholder="Input host" />}
          />
          <FormField
            control={control}
            name="port"
            label="Port"
            required
            render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder={kind.defaultPort} />}
          />
          {kind.database === 'oracle' && (
            <FormField
              control={control}
              name="oracleTarget"
              label="Connection type"
              render={field => <Select {...field} options={ORACLE_TARGETS} />}
            />
          )}
          {kind.database !== 'none' && (
            <FormField
              control={control}
              name="database"
              label={database}
              required
              render={field => <Input {...field} autoComplete="off" placeholder={`Input ${database.toLowerCase()}`} />}
            />
          )}
        </>
      )}
      <FormField
        control={control}
        name="username"
        label="Username"
        required
        render={field => <Input {...field} autoComplete="off" placeholder="Input username" />}
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        render={field => <Input.Password {...field} autoComplete="new-password" placeholder="Input password" />}
      />
    </div>
  );
}
