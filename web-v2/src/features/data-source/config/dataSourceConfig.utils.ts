import { BigQueryConnection } from '@/core/connection/BigQueryConnection';
import { bigQueryLocationLabel } from '@/core/connection/bigQueryLocations';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import type { Connection } from '@/core/connection/Connection';
import { PostgreSqlConnection } from '@/core/connection/PostgreSqlConnection';
import { RedshiftConnection } from '@/core/connection/RedshiftConnection';
import { StageStatus, type RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { VerticaConnection } from '@/core/connection/VerticaConnection';
import type { StatusIcon } from '@/shared/listing/statusIcon';

/** Poll the schema refresh this often while it runs. */
export const REFRESH_POLL_MS = 2_000;

/** What the page shows below its header. */
export type ConfigBody = 'loading' | 'error' | 'empty' | 'unknown' | 'connection';

export interface ConfigQueries {
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly exists: boolean | undefined;
  /** `undefined` while loading, and for a saved type v2 can't read. */
  readonly connection: Connection | undefined;
}

export function toConfigBody({ isPending, isError, exists, connection }: ConfigQueries): ConfigBody {
  if (isError) return 'error';
  if (isPending || exists === undefined) return 'loading';
  if (!exists) return 'empty';
  return connection ? 'connection' : 'unknown';
}

export interface ConnectionRow {
  readonly label: string;
  readonly value: string;
}

function text(value: string): string {
  return value.trim() || '--';
}

function port(value: number): string {
  return value > 0 ? String(value) : '--';
}

/** The fields v1's DataSource table showed per type (`header_builder/handler-impl`), plus the database or catalog. */
export function connectionRows(connection: Connection): ConnectionRow[] {
  if (connection instanceof BigQueryConnection) {
    return [
      { label: 'Project ID', value: text(connection.projectId) },
      { label: 'Location', value: connection.location ? bigQueryLocationLabel(connection.location) : '--' }
    ];
  }
  if (connection instanceof ClickhouseConnection) {
    return [
      { label: 'Host', value: text(connection.host) },
      { label: 'Username', value: text(connection.username) },
      { label: 'HTTP Port', value: port(connection.httpPort) },
      { label: 'TCP Port', value: port(connection.tcpPort) }
    ];
  }
  const rows = [
    { label: 'Host', value: text(connection.host) },
    { label: 'Port', value: port(connection.port) },
    { label: 'Username', value: text(connection.username) }
  ];
  if (connection instanceof PostgreSqlConnection || connection instanceof RedshiftConnection) {
    return [...rows, { label: 'Database', value: text(connection.database) }];
  }
  if (connection instanceof VerticaConnection) {
    return [...rows, { label: 'Catalog', value: text(connection.catalog) }];
  }
  return rows;
}

export interface RefreshStatusView {
  readonly label: string;
  readonly icon: StatusIcon;
  /** Why the last refresh failed: the message of its failed stage. */
  readonly error?: string | undefined;
}

/** v1 `RefreshSchemaHistory.getStatusDisplayName` / `getStatusIcon`. No history yet reads as Not Started. */
export function toRefreshStatusView(history: RefreshSchemaHistory | undefined): RefreshStatusView {
  switch (history?.status ?? StageStatus.NotStarted) {
    case StageStatus.NotStarted:
      return { label: 'Not Started', icon: 'initialized' };
    case StageStatus.Running:
      return { label: 'Running', icon: 'syncing' };
    case StageStatus.Success:
      return { label: 'Synced', icon: 'synced' };
    case StageStatus.Terminated:
      return { label: 'Terminated', icon: 'terminated' };
    case StageStatus.Error: {
      const failed = history?.stages.find(stage => stage.status === StageStatus.Error && stage.message);
      return { label: 'Error', icon: 'error', error: failed?.message };
    }
    default:
      return { label: 'Unknown', icon: 'unknown' };
  }
}

/** Keep polling while a refresh runs. */
export function refreshPollInterval(history: RefreshSchemaHistory | undefined): number | false {
  return history?.isRunning ? REFRESH_POLL_MS : false;
}
