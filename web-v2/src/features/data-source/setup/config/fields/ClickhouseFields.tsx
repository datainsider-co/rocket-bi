import { Input, Switch } from 'antd';
import { Controller } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';

export function ClickhouseFields({ control }: ConnectionFieldsProps) {
  return (
    <>
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
          name="httpPort"
          label="HTTP Port"
          required
          render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder="8123" />}
        />
        <FormField
          control={control}
          name="tcpPort"
          label="TCP Port"
          required
          render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder="9000" />}
        />
        <FormField
          control={control}
          name="clusterName"
          label="Cluster name"
          render={field => <Input {...field} autoComplete="off" placeholder="Input cluster name" />}
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
      <Controller
        control={control}
        name="useSsl"
        render={({ field }) => (
          <div className="mb-6 flex items-center gap-2">
            <Switch id="useSsl" checked={field.value} onChange={field.onChange} ref={field.ref} />
            <label htmlFor="useSsl">SSL Connection</label>
          </div>
        )}
      />
    </>
  );
}
