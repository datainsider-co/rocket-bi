import { RelationshipInfo } from '@core/data-relationship';
import { Inject, InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services';
import { SchemaService } from '@core/schema/service/SchemaService';
import { BaseResponse } from '@core/common/domain';

export abstract class RelationshipRepository {
  abstract getGlobalRelationship(): Promise<RelationshipInfo>;
  abstract saveGlobalRelationship(relationship: RelationshipInfo): Promise<boolean>;

  abstract getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo>;
  abstract saveDashboardRelationship(dashboardId: number, relationship: RelationshipInfo): Promise<boolean>;
}

export class RelationshipRepositoryImpl extends RelationshipRepository {
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  @Inject
  private schemaService!: SchemaService;

  getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo> {
    return this.httpClient
      .get<RelationshipInfo>(`/relationships/${dashboardId}`, void 0, void 0, void 0)
      .then(response => RelationshipInfo.fromObject(response));
  }

  getGlobalRelationship(): Promise<RelationshipInfo> {
    return this.httpClient.get<RelationshipInfo>(`/relationships/global`).then(response => RelationshipInfo.fromObject(response));
  }

  saveDashboardRelationship(dashboardId: number, relationship: RelationshipInfo): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`/relationships/${dashboardId}`, relationship).then(response => response.success);
  }

  saveGlobalRelationship(relationship: RelationshipInfo): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`/relationships/global`, relationship).then(response => response.success);
  }
}
