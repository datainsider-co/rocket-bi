import Deneric from 'deneric2';
import { asArray, asRecord, type JsonObject } from '@/core/json/json';
import { parseField, type Field } from './Field';
import { parseQueryView, type QueryView } from './QueryView';

/**
 * Two columns that join, the first from the relationship's first view. Fields are a union picked by `class_name`,
 * so they are parsed by hand instead of through the deneric schema.
 */
export class FieldPair extends Deneric {
  firstField: Field | undefined = undefined;
  secondField: Field | undefined = undefined;

  constructor(json?: unknown) {
    super({});
    const source = asRecord(json);
    this.firstField = parseField(source.first_field);
    this.secondField = parseField(source.second_field);
  }

  static of(firstField: Field, secondField: Field): FieldPair {
    const pair = new FieldPair();
    pair.firstField = firstField;
    pair.secondField = secondField;
    return pair;
  }

  override toJson(): JsonObject {
    return { first_field: this.firstField?.toJson(), second_field: this.secondField?.toJson() };
  }
}

/** How two views join. Views are a union picked by `class_name`, so they are parsed by hand. */
export class Relationship extends Deneric {
  firstView: QueryView | undefined = undefined;
  secondView: QueryView | undefined = undefined;
  fieldPairs: FieldPair[] = [];

  constructor(json?: unknown) {
    super({});
    const source = asRecord(json);
    this.firstView = parseQueryView(source.first_view);
    this.secondView = parseQueryView(source.second_view);
    this.fieldPairs = asArray(source.field_pairs).map(pair => new FieldPair(pair));
  }

  static of(firstView: QueryView, secondView: QueryView, fieldPairs: FieldPair[]): Relationship {
    const relationship = new Relationship();
    relationship.firstView = firstView;
    relationship.secondView = secondView;
    relationship.fieldPairs = fieldPairs;
    return relationship;
  }

  override toJson(): JsonObject {
    return {
      first_view: this.firstView?.toJson(),
      second_view: this.secondView?.toJson(),
      field_pairs: this.fieldPairs.map(pair => pair.toJson())
    };
  }
}
