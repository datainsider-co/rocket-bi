/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:16 PM
 */

import { DataSources, DataSourceType, FacebookAdsSource, GoogleAdsSource, JdbcSource, MongoDBSource, S3Source, TiktokSource } from '@core/data-ingestion';
import { GoogleServiceAccountSource } from '@core/data-ingestion/domain/response/GoogleServiceAccountSource';
import { ShopifySource } from '@core/data-ingestion/domain/response/ShopifySource';
import { UnsupportedSource } from '@core/data-ingestion/domain/response/UnsupportedSource';
import { GA4Source } from '@core/data-ingestion/domain/response/GA4Source';
import { GASource } from '@core/data-ingestion/domain/response/GASource';
import { PalexySource } from '@core/data-ingestion/domain/response/PalexySource';

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
      case DataSources.GASource:
        return GASource.fromObject(obj);
      case DataSources.GA4Source:
        return GA4Source.fromObject(obj);
      case DataSources.GoogleAdsSource:
        return GoogleAdsSource.fromObject(obj);
      case DataSources.FacebookAds:
        return FacebookAdsSource.fromObject(obj);
      case DataSources.TiktokAds:
        return TiktokSource.fromObject(obj);
      case DataSources.Palexy:
        return PalexySource.fromObject(obj);
      default:
        return UnsupportedSource.fromObject(obj);
    }
  }
}
