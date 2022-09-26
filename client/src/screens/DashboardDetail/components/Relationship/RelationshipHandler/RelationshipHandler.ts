import { RelationshipInfo } from '@core/DataRelationship';

export enum RelationshipType {
  Global = 'global',
  Dashboard = 'dashboard'
}

//with each relationship handler, call a specific api to get & save relationship
export abstract class RelationshipHandler {
  abstract className: RelationshipType;

  //get views, relationships, view positions(extraData) corresponding to handler
  /**
   * @throws {DIException} Error if load failure
   */
  abstract getRelationshipInfo(): Promise<RelationshipInfo>;

  //save views, relationships, view positions(extraData) corresponding to handler
  /**
   * @throws {DIException} Error if load failure
   */
  abstract saveRelationshipInfo(relationship: RelationshipInfo): Promise<boolean>;
}
