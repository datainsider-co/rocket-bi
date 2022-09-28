import { RelationshipInfo, RelationshipRepository } from '@core/DataRelationship';
import { Inject } from 'typescript-ioc';

export abstract class RelationshipService {
  abstract getGlobalRelationship(): Promise<RelationshipInfo>;
  abstract saveGlobalRelationship(relationship: RelationshipInfo): Promise<boolean>;

  abstract getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo>;
  abstract saveDashboardRelationship(dashboardId: number, relationship: RelationshipInfo): Promise<boolean>;
}

export class RelationshipServiceImpl extends RelationshipService {
  @Inject
  private repository!: RelationshipRepository;

  getDashboardRelationship(dashboardId: number): Promise<RelationshipInfo> {
    return this.repository.getDashboardRelationship(dashboardId);
  }

  getGlobalRelationship(): Promise<RelationshipInfo> {
    return this.repository.getGlobalRelationship();
  }

  saveDashboardRelationship(dashboardId: number, relationship: RelationshipInfo): Promise<boolean> {
    return this.repository.saveDashboardRelationship(dashboardId, relationship);
  }

  saveGlobalRelationship(relationship: RelationshipInfo): Promise<boolean> {
    return this.repository.saveGlobalRelationship(relationship);
  }
}
