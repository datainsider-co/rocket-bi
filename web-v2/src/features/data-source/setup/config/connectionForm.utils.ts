import { z } from 'zod';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import type { Connection } from '@/core/connection/Connection';
import { createConnection } from '@/core/connection/Connection';
import { ConnectionType } from '@/core/connection/ConnectionType';
import { DEFAULT_SSH_TIMEOUT_MS, SshConfig } from '@/core/connection/SshConfig';
import { portError, requiredError } from '@/shared/form/fieldErrors';
import { fromPropertyRows, propertyKeyErrors, toPropertyRows } from '@/shared/properties/properties.utils';

/** v1 shortened the SSH timeout for "Test connection" so a wrong tunnel fails fast. */
export const TEST_SSH_TIMEOUT_MS = 30_000;

/**
 * One form for every supported type: fields another type doesn't use stay empty and are ignored by `toConnection`.
 * Ports are strings because they come from text inputs.
 */
export const connectionFormSchema = z
  .object({
    type: z.enum([ConnectionType.Clickhouse, ConnectionType.MySql]),
    host: z.string(),
    port: z.string(),
    httpPort: z.string(),
    tcpPort: z.string(),
    clusterName: z.string(),
    useSsl: z.boolean(),
    username: z.string(),
    password: z.string(),
    ssh: z.object({ host: z.string(), port: z.string(), username: z.string(), publicKey: z.string() }),
    properties: z.array(z.object({ key: z.string(), value: z.string() }))
  })
  .superRefine((values, ctx) => {
    const fail = (path: (string | number)[], message: string | undefined) => {
      if (message) ctx.addIssue({ code: 'custom', path, message });
    };

    fail(['host'], requiredError(values.host, 'Host'));
    fail(['username'], requiredError(values.username, 'Username'));
    if (values.type === ConnectionType.Clickhouse) {
      fail(['httpPort'], portError(values.httpPort, 'HTTP port'));
      fail(['tcpPort'], portError(values.tcpPort, 'TCP port'));
    } else {
      fail(['port'], portError(values.port, 'Port'));
    }

    if (hasSshTunnel(values.ssh)) {
      fail(['ssh', 'host'], requiredError(values.ssh.host, 'SSH host'));
      fail(['ssh', 'port'], portError(values.ssh.port, 'SSH port'));
      fail(['ssh', 'username'], requiredError(values.ssh.username, 'SSH username'));
      fail(['ssh', 'publicKey'], requiredError(values.ssh.publicKey, 'Public key'));
    }

    propertyKeyErrors(values.properties).forEach((message, index) => fail(['properties', index, 'key'], message));
  });

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
export type SshFormValues = ConnectionFormValues['ssh'];

/** Like v1, the tunnel is on as soon as one of host, port or username is filled; the key alone doesn't count. */
export function hasSshTunnel(ssh: SshFormValues): boolean {
  return [ssh.host, ssh.port, ssh.username].some(value => value.trim() !== '');
}

function portText(port: number): string {
  return port > 0 ? String(port) : '';
}

export function toFormValues(connection: Connection): ConnectionFormValues {
  const tunnel = connection.tunnelConfig;
  const clickhouse = connection instanceof ClickhouseConnection ? connection : undefined;
  return {
    type: connection.className,
    host: connection.host,
    port: connection instanceof ClickhouseConnection ? '' : portText(connection.port),
    httpPort: portText(clickhouse?.httpPort ?? 0),
    tcpPort: portText(clickhouse?.tcpPort ?? 0),
    clusterName: clickhouse?.clusterName ?? '',
    useSsl: clickhouse?.useSsl ?? false,
    username: connection.username,
    password: connection.password,
    ssh: {
      host: tunnel?.host ?? '',
      port: portText(tunnel?.port ?? 0),
      username: tunnel?.username ?? '',
      publicKey: tunnel?.publicKey ?? ''
    },
    properties: toPropertyRows(connection.properties)
  };
}

export function defaultFormValues(type: ConnectionType): ConnectionFormValues {
  return toFormValues(createConnection(type));
}

function toSshConfig(ssh: SshFormValues, timeoutMs: number): SshConfig {
  const config = new SshConfig();
  config.host = ssh.host.trim();
  config.port = Number(ssh.port.trim());
  config.username = ssh.username.trim();
  config.publicKey = ssh.publicKey;
  config.timeoutMs = timeoutMs;
  return config;
}

/** Builds the connection to send from valid form values. Hosts, usernames and keys are trimmed; passwords are not. */
export function toConnection(values: ConnectionFormValues, sshTimeoutMs = DEFAULT_SSH_TIMEOUT_MS): Connection {
  const connection = createConnection(values.type);
  connection.host = values.host.trim();
  connection.username = values.username.trim();
  connection.password = values.password;
  connection.properties = fromPropertyRows(values.properties);
  connection.tunnelConfig = hasSshTunnel(values.ssh) ? toSshConfig(values.ssh, sshTimeoutMs) : undefined;

  if (connection instanceof ClickhouseConnection) {
    connection.httpPort = Number(values.httpPort.trim());
    connection.tcpPort = Number(values.tcpPort.trim());
    connection.clusterName = values.clusterName.trim();
    connection.useSsl = values.useSsl;
  } else {
    connection.port = Number(values.port.trim());
  }
  return connection;
}
