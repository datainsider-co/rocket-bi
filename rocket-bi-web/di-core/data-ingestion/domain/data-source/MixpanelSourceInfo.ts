import { SourceId } from '@core/common/domain';
import { MixpanelSource } from '@core/data-ingestion';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';

export enum MixpanelRegion {
  US = 'US',
  EU = 'EU'
}

export class MixpanelSourceInfo implements DataSourceInfo {
  className = DataSources.Mixpanel;
  sourceType = DataSourceType.Mixpanel;
  id: SourceId;
  orgId: string;
  displayName: string;
  accountUsername: string;
  accountSecret: string;
  projectId: string;
  region: MixpanelRegion;
  timezone: string;
  lastModify: number;

  constructor(
    id: SourceId,
    orgId: string,
    displayName: string,
    accountUsername: string,
    accountSecret: string,
    projectId: string,
    region: MixpanelRegion,
    timezone: string,
    lastModify: number
  ) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.lastModify = lastModify;
    this.accountUsername = accountUsername;
    this.accountSecret = accountSecret;
    this.projectId = projectId;
    this.region = region;
    this.timezone = timezone;
  }

  static default(): MixpanelSourceInfo {
    return new MixpanelSourceInfo(-1, '-1', '', '', '', '', MixpanelRegion.US, 'US/Pacific', Date.now());
  }

  static fromObject(obj: any): MixpanelSourceInfo {
    return new MixpanelSourceInfo(
      obj.id,
      obj.orgId ?? '-1',
      obj.displayName ?? '',
      obj.accountUsername ?? '',
      obj.accountSecret ?? '',
      obj.projectId ?? '',
      obj.region ?? MixpanelRegion.US,
      obj.timezone ?? 'US/Pacific',
      obj.lastModify ?? Date.now()
    );
  }

  toDataSource(): DataSource {
    return new MixpanelSource(
      this.id,
      this.orgId,
      this.displayName,
      this.accountUsername,
      this.accountSecret,
      this.projectId,
      this.region,
      this.timezone,
      this.lastModify
    );
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
