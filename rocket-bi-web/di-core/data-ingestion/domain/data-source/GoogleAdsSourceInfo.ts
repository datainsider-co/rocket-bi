import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { GoogleCredentialSource } from '@core/data-ingestion/domain/response/GoogleCredentialSource';
import { GoogleAdsSource } from '@core/data-ingestion';

export class GoogleAdsSourceInfo implements DataSourceInfo {
  className = DataSources.GoogleAdsSource;
  sourceType = DataSourceType.GoogleAds;
  id: SourceId;
  orgId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, accessToken: string, refreshToken: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.lastModify = lastModify;
  }

  static fromGoogleCredentialSource(ggCredentialSource: GoogleCredentialSource): DataSourceInfo {
    return new GoogleAdsSourceInfo(
      ggCredentialSource.id,
      ggCredentialSource.orgId,
      ggCredentialSource.displayName,
      ggCredentialSource.accessToken,
      ggCredentialSource.refreshToken,
      ggCredentialSource.lastModify
    );
  }

  static default(): GoogleAdsSourceInfo {
    return new GoogleAdsSourceInfo(-1, '-1', '', '', '', 0);
  }

  static fromObject(obj: any): GoogleAdsSourceInfo {
    return new GoogleAdsSourceInfo(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.refreshToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    return new GoogleAdsSource(this.id, this.orgId, this.displayName, this.refreshToken, this.accessToken, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    return this;
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    return this;
  }
}
