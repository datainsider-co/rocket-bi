import { RelationshipHandler, RelationshipType } from '@/screens/dashboard-detail/components/relationship/relationship-handler/RelationshipHandler';
import { RelationshipInfo, RelationshipService } from '@core/data-relationship';
import { Inject } from 'typescript-ioc';

export class GlobalRelationshipHandler implements RelationshipHandler {
  className: RelationshipType = RelationshipType.Global;

  @Inject
  private relationshipService!: RelationshipService;

  getRelationshipInfo(): Promise<RelationshipInfo> {
    return this.relationshipService.getGlobalRelationship();
  }

  saveRelationshipInfo(relationship: RelationshipInfo): Promise<boolean> {
    return this.relationshipService.saveGlobalRelationship(relationship);
  }
}
