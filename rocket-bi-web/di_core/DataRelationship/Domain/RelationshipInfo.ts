import { Relationship } from '@core/DataRelationship/Domain/Relationship';
import { QueryView } from '@core/DataRelationship/Domain/QueryView';
import { Log } from '@core/utils';
import { Field } from '@core/domain';

export class TablePosition {
  constructor(public left: number, public top: number) {}

  static fromObject(obj: TablePosition) {
    return new TablePosition(obj.left, obj.top);
  }
}

export class RelationshipExtraData {
  constructor(public tablePositions: Map<string, TablePosition>) {}

  static fromObject(obj: RelationshipExtraData) {
    const data = obj?.tablePositions ? obj.tablePositions : {};
    const result = new Map<string, TablePosition>();
    for (const [key, value] of Object.entries(data)) {
      result.set(key, TablePosition.fromObject(value as TablePosition));
    }
    return new RelationshipExtraData(result);
  }
}

export class RelationshipInfo {
  constructor(public views: QueryView[], public relationships: Relationship[], public extraData: RelationshipExtraData) {}

  static fromObject(obj: RelationshipInfo): RelationshipInfo {
    Log.debug('extraData::', obj.extraData);
    return new RelationshipInfo(
      obj.views.map(view => QueryView.fromObject(view)),
      obj.relationships.map(rel => Relationship.fromObject(rel)),
      RelationshipExtraData.fromObject(obj.extraData)
    );
  }
}
