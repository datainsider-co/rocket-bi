import { ConnectionType } from '@/core/connection/ConnectionType';

export interface ConnectorOption {
  type: ConnectionType;
  name: string;
  /** The type picker's tile. */
  logoUrl: string;
  /** The small icon next to the connection's name on the settings page. */
  iconUrl: string;
}

/** Logos come from v1 (`assets/icon/data_ingestion/datasource/source_selection_modal`). */
export const CONNECTOR_OPTIONS: readonly ConnectorOption[] = [
  {
    type: ConnectionType.Clickhouse,
    name: 'ClickHouse',
    logoUrl: '/data-source/clickhouse_source.svg',
    iconUrl: '/data-source/clickhouse_small.svg'
  },
  {
    type: ConnectionType.MySql,
    name: 'MySQL',
    logoUrl: '/data-source/mysql_source.svg',
    iconUrl: '/data-source/my_sql_small.png'
  },
  {
    type: ConnectionType.PostgreSql,
    name: 'PostgreSQL',
    logoUrl: '/data-source/postgresql_source.svg',
    iconUrl: '/data-source/postgresql_small.svg'
  },
  {
    type: ConnectionType.Redshift,
    name: 'Redshift',
    logoUrl: '/data-source/redshift.svg',
    iconUrl: '/data-source/ic_redshift_small.png'
  },
  {
    type: ConnectionType.Vertica,
    name: 'Vertica',
    logoUrl: '/data-source/vertica_source.svg',
    iconUrl: '/data-source/ic_vertica_small.png'
  },
  {
    type: ConnectionType.BigQuery,
    name: 'BigQuery',
    logoUrl: '/data-source/bigquery_source.svg',
    iconUrl: '/data-source/bigquery_small.svg'
  }
];

/** The small icon of a connection type; every type has one. */
export function connectorIconUrl(type: ConnectionType): string | undefined {
  return CONNECTOR_OPTIONS.find(option => option.type === type)?.iconUrl;
}
