/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:17 PM
 */

import { DataSourceType, DataSources, MongoTLSConfig } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class MongoDBSource implements DataSource {
  id: SourceId;
  orgId: string;
  databaseType: DataSourceType;
  displayName: string;
  host: string;
  port: string | undefined;
  username: string;
  password: string;
  lastModify: number;
  readonly className = DataSources.MongoDbSource;
  tlsConfiguration: MongoTLSConfig | undefined;
  connectionUri?: string;

  constructor(
    id: SourceId,
    orgId: string,
    databaseType: DataSourceType,
    displayName: string,
    host: string,
    port: string | undefined,
    username: string,
    password: string,
    lastModify: number,
    tlsConfiguration: MongoTLSConfig | undefined,
    connectionUri?: string
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
    this.tlsConfiguration = tlsConfiguration;
    this.connectionUri = connectionUri;
  }

  static fromObject(obj: any): MongoDBSource {
    const tlsConfig = obj.tlsConfiguration ? MongoTLSConfig.fromObject(obj.tlsConfiguration) : void 0;
    return new MongoDBSource(
      obj.id,
      obj.orgId,
      obj.databaseType,
      obj.displayName,
      obj.host,
      obj.port || void 0,
      obj.username,
      obj.password,
      obj.lastModify,
      tlsConfig,
      obj.connectionUri
    );
  }
}
