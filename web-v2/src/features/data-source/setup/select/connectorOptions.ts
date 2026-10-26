import { ConnectionType } from '@/core/connection/ConnectionType';

export interface ConnectorOption {
  type: ConnectionType;
  name: string;
  logoUrl: string;
}

/** Logos come from v1 (`assets/icon/data_ingestion/datasource/source_selection_modal`). */
export const CONNECTOR_OPTIONS: readonly ConnectorOption[] = [
  { type: ConnectionType.Clickhouse, name: 'ClickHouse', logoUrl: '/data-source/clickhouse_source.svg' },
  { type: ConnectionType.MySql, name: 'MySQL', logoUrl: '/data-source/mysql_source.svg' }
];
