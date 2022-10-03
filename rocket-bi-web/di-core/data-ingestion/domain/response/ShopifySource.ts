/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:17 PM
 */

import { DataSourceType, DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class ShopifySource implements DataSource {
  id: SourceId;
  orgId: string;
  databaseType: DataSourceType;
  displayName: string;
  apiUrl: string;
  apiVersion: string;
  accessToken: string;
  lastModify: number;
  creatorId: string;
  readonly className = DataSources.ShopifySource;

  constructor(
    id: SourceId,
    orgId: string,
    databaseType: DataSourceType,
    displayName: string,
    apiUrl: string,
    apiVersion: string,
    accessToken: string,
    creatorId: string,
    lastModify: number
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.apiUrl = apiUrl;
    this.apiVersion = apiVersion;
    this.accessToken = accessToken;
    this.creatorId = creatorId;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): ShopifySource {
    return new ShopifySource(obj.id, obj.orgId, obj.databaseType, obj.displayName, obj.apiUrl, obj.apiVersion, obj.accessToken, obj.creatorId, obj.lastModify);
  }
}
