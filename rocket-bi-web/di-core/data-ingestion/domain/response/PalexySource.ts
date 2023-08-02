/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:17 PM
 */

import { DataSourceType, DataSources } from '@core/data-ingestion';
import { S3Region } from '@core/data-ingestion/domain/data-source/S3SourceInfo';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class PalexySource implements DataSource {
  readonly className = DataSources.Palexy;
  databaseType = DataSourceType.Palexy;
  orgId: string;
  id: SourceId;
  displayName: string;
  lastModify: number;
  apiKey: string;

  constructor(id: SourceId, orgId: string, displayName: string, lastModify: number, apiKey: string) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.lastModify = lastModify;
    this.apiKey = apiKey;
  }

  static fromObject(obj: any): PalexySource {
    return new PalexySource(obj.id, obj.orgId, obj.displayName, obj.lastModify, obj.apiKey);
  }
}
