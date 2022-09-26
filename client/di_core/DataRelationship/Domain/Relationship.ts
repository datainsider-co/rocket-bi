import { Field } from '@core/domain';
import { QueryView } from '@core/DataRelationship';

export class FieldPair {
  constructor(public firstField: Field, public secondField: Field) {}

  static fromObject(obj: FieldPair) {
    return new FieldPair(Field.fromObject(obj.firstField), Field.fromObject(obj.secondField));
  }
}

export class Relationship {
  constructor(public firstView: QueryView, public secondView: QueryView, public fieldPairs: FieldPair[]) {}

  static fromObject(obj: Relationship): Relationship {
    return new Relationship(
      QueryView.fromObject(obj.firstView),
      QueryView.fromObject(obj.secondView),
      obj.fieldPairs.map(fieldPair => FieldPair.fromObject(fieldPair))
    );
  }
}
