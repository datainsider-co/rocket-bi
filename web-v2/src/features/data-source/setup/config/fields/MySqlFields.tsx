import type { ConnectionFieldsProps } from './ConnectionFieldsFactory';
import { HostPortFields } from './HostPortFields';

export function MySqlFields({ control }: ConnectionFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      <HostPortFields control={control} defaultPort="3306" />
    </div>
  );
}
