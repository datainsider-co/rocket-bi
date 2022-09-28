import { S3Source } from '@core/DataIngestion';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { SourceId } from '@core/domain';

export enum S3Region {
  GovCloud = 'us-gov-west-1',
  US_GOV_EAST_1 = 'us-gov-east-1',
  US_EAST_1 = 'us-east-1',
  US_EAST_2 = 'us-east-2',
  US_WEST_1 = 'us-west-1',
  US_WEST_2 = 'us-west-2',
  EU_WEST_1 = 'eu-west-1',
  EU_WEST_2 = 'eu-west-2',
  EU_WEST_3 = 'eu-west-3',
  EU_CENTRAL_1 = 'eu-central-1',
  EU_NORTH_1 = 'eu-north-1',
  EU_SOUTH_1 = 'eu-south-1',
  AP_EAST_1 = 'ap-east-1',
  AP_SOUTH_1 = 'ap-south-1',
  AP_SOUTHEAST_1 = 'ap-southeast-1',
  AP_SOUTHEAST_2 = 'ap-southeast-2',
  AP_SOUTHEAST_3 = 'ap-southeast-3',
  AP_NORTHEAST_1 = 'ap-northeast-1',
  AP_NORTHEAST_2 = 'ap-northeast-2',
  AP_NORTHEAST_3 = 'ap-northeast-3',
  SA_EAST_1 = 'sa-east-1',
  CN_NORTH_1 = 'cn-north-1',
  CN_NORTHWEST_1 = 'cn-northwest-1',
  CA_CENTRAL_1 = 'ca-central-1',
  ME_SOUTH_1 = 'me-south-1',
  AF_SOUTH_1 = 'af-south-1',
  US_ISO_EAST_1 = 'us-iso-east-1',
  US_ISOB_EAST_1 = 'us-isob-east-1',
  US_ISO_WEST_1 = 'us-iso-west-1'
}

export class S3SourceInfo implements DataSourceInfo {
  className = DataSources.S3Source;
  sourceType = DataSourceType.S3;
  id: SourceId;
  orgId: string;
  displayName: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  region: S3Region;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, awsAccessKeyId: string, awsSecretAccessKey: string, region: S3Region, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.awsAccessKeyId = awsAccessKeyId;
    this.awsSecretAccessKey = awsSecretAccessKey;
    this.region = region;
    this.lastModify = lastModify;
  }

  static fromS3Source(source: S3Source): S3SourceInfo {
    return new S3SourceInfo(source.id, source.orgId, source.displayName, source.awsAccessKeyId, source.awsSecretAccessKey, source.region, source.lastModify);
  }

  static fromObject(obj: any): S3SourceInfo {
    return new S3SourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.awsAccessKeyId ?? '',
      obj.awsSecretAccessKey ?? '',
      obj.region ?? S3Region.US_ISO_EAST_1,
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    return new S3Source(this.id, this.orgId, this.sourceType, this.displayName, this.awsAccessKeyId, this.awsSecretAccessKey, this.region, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }

  static default(): S3SourceInfo {
    return new S3SourceInfo(DataSourceInfo.DEFAULT_ID, DataSourceInfo.DEFAULT_ID.toString(), '', '', '', S3Region.AP_SOUTHEAST_1, 0);
  }
}
