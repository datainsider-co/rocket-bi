import { Collapse, Input, Spin, Typography } from 'antd';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFormValues } from './connectionForm.utils';

interface SshTunnelFieldsProps {
  control: Control<ConnectionFormValues>;
  /** Open from the start, for a connection that already uses a tunnel. */
  defaultOpen: boolean;
  isPublicKeyLoading: boolean;
  /** Called each time the section opens; loads the public key the SSH host must trust. */
  onOpen: () => void;
}

/** Optional: filling any of host, port or username turns the tunnel on (see `hasSshTunnel`). */
export function SshTunnelFields({ control, defaultOpen, isPublicKeyLoading, onOpen }: SshTunnelFieldsProps) {
  const fields = (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="ssh.host"
        label="SSH Host"
        render={field => <Input {...field} autoComplete="off" placeholder="ex: rocket-bi.ddns.net" />}
      />
      <FormField
        control={control}
        name="ssh.port"
        label="SSH Port"
        render={field => <Input {...field} inputMode="numeric" autoComplete="off" placeholder="ex: 22" />}
      />
      <FormField
        control={control}
        name="ssh.username"
        label="SSH Username"
        render={field => <Input {...field} autoComplete="off" placeholder="ex: datainsider" />}
      />
      <FormField
        control={control}
        name="ssh.publicKey"
        label="Public Key"
        render={field => (
          <Input
            {...field}
            readOnly
            suffix={
              isPublicKeyLoading ? (
                <Spin size="small" />
              ) : (
                <Typography.Text copyable={field.value ? { text: field.value } : false} />
              )
            }
          />
        )}
      />
    </div>
  );

  return (
    <Collapse
      className="mb-4"
      size="small"
      defaultActiveKey={defaultOpen ? ['ssh'] : []}
      onChange={keys => {
        if (keys.length > 0) onOpen();
      }}
      items={[{ key: 'ssh', label: 'Connect using an SSH tunnel', children: fields, forceRender: true }]}
    />
  );
}
