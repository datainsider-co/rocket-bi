import { JdbcDatabaseType } from '@/core/ingestion/DataSource';

/**
 * What differs between the JDBC source types v2 edits: one entry per `database_type`, read by the listing (type
 * label), the catalog (title, image) and the source form (fields, Properties).
 */
export interface JdbcSourceKind {
  readonly databaseType: JdbcDatabaseType;
  readonly label: string;
  /** Catalog image (118 × 80) from v1, under `public/ingestion/sources/`. */
  readonly iconUrl: string;
  /** What identifies the database after host and port: nothing (MySQL), a database name, or an Oracle service. */
  readonly database: 'none' | 'database' | 'oracle';
  /** The form fills the port with it for a new source. Empty for Generic JDBC, whose URL is typed. */
  readonly defaultPort: string;
  /** The URL takes extra `?k=v` properties (v1 `SupportCustomProperty`: MySQL and Oracle). */
  readonly properties: boolean;
  /** What a new source starts with, as in v1 (`MySqlSourceInfo.fromObject`). */
  readonly defaultProperties: Readonly<Record<string, string>>;
}

const ICON_DIR = '/ingestion/sources';

function kind(
  databaseType: JdbcDatabaseType,
  label: string,
  icon: string,
  rest: Pick<JdbcSourceKind, 'database' | 'defaultPort'> & Partial<Pick<JdbcSourceKind, 'properties' | 'defaultProperties'>>
): JdbcSourceKind {
  return { databaseType, label, iconUrl: `${ICON_DIR}/${icon}`, properties: false, defaultProperties: {}, ...rest };
}

export const JDBC_SOURCE_KINDS: Readonly<Record<JdbcDatabaseType, JdbcSourceKind>> = {
  [JdbcDatabaseType.GenericJdbc]: kind(JdbcDatabaseType.GenericJdbc, 'Generic JDBC', 'ic_generic_jdbc.png', {
    database: 'none',
    defaultPort: ''
  }),
  [JdbcDatabaseType.MySql]: kind(JdbcDatabaseType.MySql, 'MySQL', 'ic_mysql.png', {
    database: 'none',
    defaultPort: '3306',
    properties: true,
    defaultProperties: { connectTimeout: '30000' }
  }),
  [JdbcDatabaseType.Oracle]: kind(JdbcDatabaseType.Oracle, 'Oracle', 'ic_oracle.png', {
    database: 'oracle',
    defaultPort: '1521',
    properties: true
  }),
  [JdbcDatabaseType.SqlServer]: kind(JdbcDatabaseType.SqlServer, 'Microsoft SQL', 'ic_sql_server.png', {
    database: 'database',
    defaultPort: '1433'
  }),
  [JdbcDatabaseType.Redshift]: kind(JdbcDatabaseType.Redshift, 'Redshift', 'ic_redshift.png', {
    database: 'database',
    defaultPort: '5439'
  }),
  [JdbcDatabaseType.Postgres]: kind(JdbcDatabaseType.Postgres, 'PostgreSQL', 'ic_postgresql.png', {
    database: 'database',
    defaultPort: '5432'
  })
};
