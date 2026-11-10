import { Input } from 'antd';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';

interface HostPortFieldsProps extends ConnectionFieldsProps {
  /** Placeholder of the port: the type's usual one. */
  defaultPort: string;
}

/** Host, port, username and password: what every JDBC type but ClickHouse starts with. */
export function HostPortFields({ control, defaultPort }: HostPortFieldsProps) {
  return (
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
        render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder={defaultPort} />}
      />
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
    </>
  );
}
