import { z } from 'zod';
import { BigQueryConnection } from '@/core/connection/BigQueryConnection';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import type { Connection } from '@/core/connection/Connection';
import { createConnection } from '@/core/connection/Connection';
import { ConnectionType, supportsProperties, supportsSshTunnel } from '@/core/connection/ConnectionType';
import { PostgreSqlConnection } from '@/core/connection/PostgreSqlConnection';
import { RedshiftConnection } from '@/core/connection/RedshiftConnection';
import { DEFAULT_SSH_TIMEOUT_MS, SshConfig } from '@/core/connection/SshConfig';
import { VerticaConnection } from '@/core/connection/VerticaConnection';
import { portError, requiredError } from '@/shared/form/fieldErrors';
import { fromPropertyRows, propertyKeyErrors, toPropertyRows } from '@/shared/properties/properties.utils';

/** v1 shortened the SSH timeout for "Test connection" so a wrong tunnel fails fast. */
export const TEST_SSH_TIMEOUT_MS = 30_000;

/** `undefined` when `text` is a JSON object, like a service account key. */
export function jsonObjectError(text: string, label: string): string | undefined {
  if (!text.trim()) return `${label} is required!`;
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? undefined : `${label} must be a JSON object`;
  } catch {
    return `${label} must be valid JSON`;
  }
}

/**
 * One form for every supported type: fields another type doesn't use stay empty and are ignored by `toConnection`.
 * Ports are strings because they come from text inputs.
 */
export const connectionFormSchema = z
  .object({
    type: z.enum(ConnectionType),
    host: z.string(),
    port: z.string(),
    httpPort: z.string(),
    tcpPort: z.string(),
    clusterName: z.string(),
    useSsl: z.boolean(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
    catalog: z.string(),
    isLoadBalance: z.boolean(),
    projectId: z.string(),
    credentials: z.string(),
    location: z.string(),
    ssh: z.object({ host: z.string(), port: z.string(), username: z.string(), publicKey: z.string() }),
    properties: z.array(z.object({ key: z.string(), value: z.string() }))
  })
  .superRefine((values, ctx) => {
    const fail = (path: (string | number)[], message: string | undefined) => {
      if (message) ctx.addIssue({ code: 'custom', path, message });
    };

    switch (values.type) {
      case ConnectionType.BigQuery:
        fail(['credentials'], jsonObjectError(values.credentials, 'Credentials'));
        fail(['projectId'], requiredError(values.projectId, 'Project ID'));
        fail(['location'], requiredError(values.location, 'Location'));
        return;
      case ConnectionType.Clickhouse:
        fail(['httpPort'], portError(values.httpPort, 'HTTP port'));
        fail(['tcpPort'], portError(values.tcpPort, 'TCP port'));
        break;
      case ConnectionType.PostgreSql:
      case ConnectionType.Redshift:
        fail(['port'], portError(values.port, 'Port'));
        fail(['database'], requiredError(values.database, 'Database'));
        break;
      case ConnectionType.MySql:
      case ConnectionType.Vertica:
        fail(['port'], portError(values.port, 'Port'));
        break;
    }
    fail(['host'], requiredError(values.host, 'Host'));
    fail(['username'], requiredError(values.username, 'Username'));

    if (supportsSshTunnel(values.type) && hasSshTunnel(values.ssh)) {
      fail(['ssh', 'host'], requiredError(values.ssh.host, 'SSH host'));
      fail(['ssh', 'port'], portError(values.ssh.port, 'SSH port'));
      fail(['ssh', 'username'], requiredError(values.ssh.username, 'SSH username'));
      fail(['ssh', 'publicKey'], requiredError(values.ssh.publicKey, 'Public key'));
    }

    if (supportsProperties(values.type)) {
      propertyKeyErrors(values.properties).forEach((message, index) => fail(['properties', index, 'key'], message));
    }
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

const EMPTY_VALUES: Omit<ConnectionFormValues, 'type'> = {
  host: '',
  port: '',
  httpPort: '',
  tcpPort: '',
  clusterName: '',
  useSsl: false,
  username: '',
  password: '',
  database: '',
  catalog: '',
  isLoadBalance: false,
  projectId: '',
  credentials: '',
  location: '',
  ssh: { host: '', port: '', username: '', publicKey: '' },
  properties: []
};

/** The fields only one type has; the rest of the form stays empty. */
function typeFields(connection: Connection): Partial<ConnectionFormValues> {
  if (connection instanceof BigQueryConnection) {
    return { projectId: connection.projectId, credentials: connection.credentials, location: connection.location };
  }
  const common = { host: connection.host, username: connection.username, password: connection.password };
  if (connection instanceof ClickhouseConnection) {
    return {
      ...common,
      httpPort: portText(connection.httpPort),
      tcpPort: portText(connection.tcpPort),
      clusterName: connection.clusterName,
      useSsl: connection.useSsl
    };
  }
  const port = portText(connection.port);
  if (connection instanceof PostgreSqlConnection || connection instanceof RedshiftConnection) {
    return { ...common, port, database: connection.database };
  }
  if (connection instanceof VerticaConnection) {
    return { ...common, port, catalog: connection.catalog, isLoadBalance: connection.isLoadBalance };
  }
  return { ...common, port };
}

export function toFormValues(connection: Connection): ConnectionFormValues {
  const tunnel = connection.tunnelConfig;
  return {
    ...EMPTY_VALUES,
    ...typeFields(connection),
    type: connection.className,
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

/**
 * Builds the connection to send from valid form values. Hosts, usernames and keys are trimmed; passwords and
 * credentials are not. A tunnel or properties are only kept for the types that have them.
 */
export function toConnection(values: ConnectionFormValues, sshTimeoutMs = DEFAULT_SSH_TIMEOUT_MS): Connection {
  const connection = createConnection(values.type);
  if (supportsProperties(values.type)) connection.properties = fromPropertyRows(values.properties);
  if (supportsSshTunnel(values.type) && hasSshTunnel(values.ssh)) {
    connection.tunnelConfig = toSshConfig(values.ssh, sshTimeoutMs);
  }

  if (connection instanceof BigQueryConnection) {
    connection.projectId = values.projectId.trim();
    connection.credentials = values.credentials;
    connection.location = values.location;
    return connection;
  }

  connection.host = values.host.trim();
  connection.username = values.username.trim();
  connection.password = values.password;
  if (connection instanceof ClickhouseConnection) {
    connection.httpPort = Number(values.httpPort.trim());
    connection.tcpPort = Number(values.tcpPort.trim());
    connection.clusterName = values.clusterName.trim();
    connection.useSsl = values.useSsl;
    return connection;
  }

  connection.port = Number(values.port.trim());
  if (connection instanceof PostgreSqlConnection || connection instanceof RedshiftConnection) {
    connection.database = values.database.trim();
  } else if (connection instanceof VerticaConnection) {
    connection.catalog = values.catalog.trim();
    connection.isLoadBalance = values.isLoadBalance;
  }
  return connection;
}
