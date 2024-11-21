import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { GoogleServiceAccountSource } from '@core/data-ingestion/domain/response/GoogleServiceAccountSource';

export class BigQuerySourceInfoV2 implements DataSourceInfo {
  className = DataSources.GoogleServiceAccountSource;
  sourceType = DataSourceType.BigQueryV2;
  id: SourceId;
  orgId: string;
  displayName: string;
  credential: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, credential: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.credential = credential;
    this.lastModify = lastModify;
  }

  static fromGoogleServiceAccountSource(ggCredentialSource: GoogleServiceAccountSource): DataSourceInfo {
    const googleAnalyticsSourceInfo = new BigQuerySourceInfoV2(
      ggCredentialSource.id,
      ggCredentialSource.orgId,
      ggCredentialSource.displayName,
      ggCredentialSource.credential,
      ggCredentialSource.lastModify
    );
    return googleAnalyticsSourceInfo;
  }

  static default(): DataSourceInfo {
    return new BigQuerySourceInfoV2(-1, '-1', '', '', 0);
  }

  static fromObject(obj: any): BigQuerySourceInfoV2 {
    return new BigQuerySourceInfoV2(obj.id, obj.orgId ?? '-1', obj.displayName, obj.credential, obj.lastModify);
  }

  toDataSource(): DataSource {
    const request = new GoogleServiceAccountSource(this.id, this.orgId, this.displayName, this.credential, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
