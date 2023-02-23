import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class TableRelationShipUsage implements Usage {
  className = UsageClassName.TableRelationshipUsage;

  static fromObject(obj: any): TableRelationShipUsage {
    return new TableRelationShipUsage();
  }
}
