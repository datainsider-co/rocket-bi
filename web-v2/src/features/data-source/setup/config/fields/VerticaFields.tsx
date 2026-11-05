import { Input, Switch } from 'antd';
import { Controller } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';
import { HostPortFields } from './HostPortFields';

/** v1 `VerticaConnectorForm`: host, port, credentials, an optional catalog and load balancing. */
export function VerticaFields({ control }: ConnectionFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <HostPortFields control={control} defaultPort="5433" />
        <FormField
          control={control}
          name="catalog"
          label="Catalog"
          render={field => <Input {...field} autoComplete="off" placeholder="Input catalog" />}
        />
      </div>
      <Controller
        control={control}
        name="isLoadBalance"
        render={({ field }) => (
          <div className="mb-6 flex items-center gap-2">
            <Switch id="isLoadBalance" checked={field.value} onChange={field.onChange} ref={field.ref} />
            <label htmlFor="isLoadBalance">Using load balancing</label>
          </div>
        )}
      />
    </>
  );
}
