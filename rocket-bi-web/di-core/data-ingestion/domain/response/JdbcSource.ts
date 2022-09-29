/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:17 PM
 */

import { DataSourceType, DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class JdbcSource implements DataSource {
  id: SourceId;
  orgId: string;
  databaseType: DataSourceType;
  displayName: string;
  jdbcUrl: string;
  username: string;
  password: string;
  lastModify: number;
  readonly className = DataSources.JdbcSource;

  constructor(
    id: SourceId,
    orgId: string,
    databaseType: DataSourceType,
    displayName: string,
    jdbcURL: string,
    username: string,
    password: string,
    lastModify: number
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.jdbcUrl = jdbcURL;
    this.username = username;
    this.password = password;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): JdbcSource {
    return new JdbcSource(obj.id, obj.orgId, obj.databaseType, obj.displayName, obj.jdbcUrl, obj.username, obj.password, obj.lastModify);
  }
}
