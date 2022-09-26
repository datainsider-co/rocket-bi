import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { SourceId } from '@core/domain';
import { ShopifySource } from '@core/DataIngestion/Domain/Response/ShopifySource';

export class ShopifySourceInfo implements DataSourceInfo {
  className = DataSources.ShopifySource;
  sourceType = DataSourceType.Shopify;
  id: SourceId;
  orgId: string;
  displayName: string;
  apiUrl: string;
  apiVersion: string;
  accessToken: string;
  creatorId: string;
  lastModify: number;

  constructor(
    id: SourceId,
    orgId: string,
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
    this.apiUrl = apiUrl;
    this.apiVersion = apiVersion;
    this.accessToken = accessToken;
    this.creatorId = creatorId;
    this.lastModify = lastModify;
  }

  static fromShopifySource(obj: ShopifySource): DataSourceInfo {
    const oracleSourceInfo = new ShopifySourceInfo(
      obj.id,
      obj.orgId,
      obj.displayName,
      obj.apiUrl,
      obj.apiVersion,
      obj.accessToken,
      obj.creatorId,
      obj.lastModify
    );
    return oracleSourceInfo;
  }

  static fromObject(obj: any): ShopifySourceInfo {
    return new ShopifySourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.apiUrl ?? '',
      obj.apiVersion ?? '2022-04',
      obj.accessToken ?? '',
      obj.creatorId ?? '',
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    const request = new ShopifySource(
      this.id,
      this.orgId,
      this.sourceType,
      this.displayName,
      this.apiUrl,
      this.apiVersion,
      this.accessToken,
      this.creatorId,
      this.lastModify
    );
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
