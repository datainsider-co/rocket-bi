/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:17 PM
 */

import { DataSourceType, DataSources } from '@core/data-ingestion';
import { S3Region } from '@core/data-ingestion/domain/data-source/S3SourceInfo';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class S3Source implements DataSource {
  readonly className = DataSources.S3Source;
  databaseType: DataSourceType;
  orgId: string;
  id: SourceId;
  displayName: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  region: S3Region;
  lastModify: number;

  constructor(
    id: SourceId,
    orgId: string,
    databaseType: DataSourceType,
    displayName: string,
    awsAccessKeyId: string,
    awsSecretAccessKey: string,
    region: S3Region,
    lastModify: number
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.awsAccessKeyId = awsAccessKeyId;
    this.awsSecretAccessKey = awsSecretAccessKey;
    this.region = region;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): S3Source {
    return new S3Source(obj.id, obj.orgId, obj.databaseType, obj.displayName, obj.awsAccessKeyId, obj.awsSecretAccessKey, obj.region, obj.lastModify);
  }
}
