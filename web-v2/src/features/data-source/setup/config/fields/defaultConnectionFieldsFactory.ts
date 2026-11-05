import { ConnectionType } from '@/core/connection/ConnectionType';
import { BigQueryFields } from './BigQueryFields';
import { ClickhouseFields } from './ClickhouseFields';
import { ConnectionFieldsFactoryBuilder } from './ConnectionFieldsFactoryBuilder';
import { PostgreSqlFields, RedshiftFields } from './DatabaseFields';
import { MySqlFields } from './MySqlFields';
import { VerticaFields } from './VerticaFields';

/** Default factory: register the fields of a new connection type here. */
export const defaultConnectionFieldsFactory = new ConnectionFieldsFactoryBuilder()
  .register(ConnectionType.Clickhouse, ClickhouseFields)
  .register(ConnectionType.MySql, MySqlFields)
  .register(ConnectionType.PostgreSql, PostgreSqlFields)
  .register(ConnectionType.Redshift, RedshiftFields)
  .register(ConnectionType.Vertica, VerticaFields)
  .register(ConnectionType.BigQuery, BigQueryFields)
  .build();
