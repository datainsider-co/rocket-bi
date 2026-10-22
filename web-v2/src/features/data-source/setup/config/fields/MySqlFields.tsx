import { Input } from 'antd';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';

export function MySqlFields({ control }: ConnectionFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
        render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder="3306" />}
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
    </div>
  );
}
