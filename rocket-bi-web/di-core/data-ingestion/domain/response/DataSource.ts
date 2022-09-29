/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:16 PM
 */

import { DataSources, DataSourceType, JdbcSource, MongoDBSource, S3Source } from '@core/data-ingestion';
import { GoogleServiceAccountSource } from '@core/data-ingestion/domain/response/GoogleServiceAccountSource';
import { ShopifySource } from '@core/data-ingestion/domain/response/ShopifySource';
import { UnsupportedSource } from '@core/data-ingestion/domain/response/UnsupportedSource';
import { GA4Source } from '@core/data-ingestion/domain/response/GA4Source';

export abstract class DataSource {
  abstract readonly className: DataSources;
  abstract databaseType?: DataSourceType;
  abstract orgId: string;
  abstract lastModify: number;

  static fromObject(obj: any): DataSource {
    switch (obj.className as DataSources) {
      case DataSources.JdbcSource:
        return JdbcSource.fromObject(obj);
      case DataSources.MongoDbSource:
        return MongoDBSource.fromObject(obj);
      case DataSources.GoogleServiceAccountSource:
        return GoogleServiceAccountSource.fromObject(obj);
      case DataSources.ShopifySource:
        return ShopifySource.fromObject(obj);
      case DataSources.S3Source:
        return S3Source.fromObject(obj);
      case DataSources.GA4Source:
        return GA4Source.fromObject(obj);
      default:
        return UnsupportedSource.fromObject(obj);
    }
  }
}
