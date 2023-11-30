import { DataSources, MixpanelRegion } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class MixpanelSource implements DataSource {
  readonly className = DataSources.Mixpanel;
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

  static fromObject(obj: any): MixpanelSource {
    return new MixpanelSource(
      obj.id,
      obj.orgId,
      obj.displayName,
      obj.accountUsername,
      obj.accountSecret,
      obj.projectId,
      obj.region,
      obj.timezone,
      obj.lastModify
    );
  }
}
