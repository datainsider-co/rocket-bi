import { ConnectionType } from '@/core/connection/ConnectionType';
import { ClickhouseFields } from './ClickhouseFields';
import { ConnectionFieldsFactoryBuilder } from './ConnectionFieldsFactoryBuilder';
import { MySqlFields } from './MySqlFields';

/** Default factory: register the fields of a new connection type here. */
export const defaultConnectionFieldsFactory = new ConnectionFieldsFactoryBuilder()
  .register(ConnectionType.Clickhouse, ClickhouseFields)
  .register(ConnectionType.MySql, MySqlFields)
  .build();
