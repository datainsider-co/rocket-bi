import { RelationshipHandler, RelationshipType } from '@/screens/dashboard-detail/components/relationship/relationship-handler/RelationshipHandler';
import { RelationshipInfo, RelationshipService } from '@core/data-relationship';
import { Inject } from 'typescript-ioc';

export class DashboardRelationshipHandler implements RelationshipHandler {
  className: RelationshipType = RelationshipType.Dashboard;

  constructor(public dashboardId: number) {}

  @Inject
  private relationshipService!: RelationshipService;

  getRelationshipInfo(): Promise<RelationshipInfo> {
    return this.relationshipService.getDashboardRelationship(this.dashboardId);
  }

  saveRelationshipInfo(relationship: RelationshipInfo): Promise<boolean> {
    return this.relationshipService.saveDashboardRelationship(this.dashboardId, relationship);
  }
}
