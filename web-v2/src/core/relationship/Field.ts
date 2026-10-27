import Deneric from 'deneric2';

/** Values of the backend's `Field.class_name` that a relationship uses. */
export const FieldClass = {
  Table: 'table_field',
  View: 'view_field'
} as const;

/** A column of a database table. `field_type` is the column type (`string`, `int64`, ...). */
export class TableField extends Deneric {
  readonly className = FieldClass.Table;
  dbName = '';
  tblName = '';
  fieldName = '';
  fieldType = '';

  constructor(json?: unknown) {
    super({
      dbName: ['db_name', String],
      tblName: ['tbl_name', String],
      fieldName: ['field_name', String],
      fieldType: ['field_type', String]
    });
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return { class_name: this.className, ...(super.toJson() as Record<string, unknown>) };
  }
}

/**
 * A column of a SQL view, named by the view's alias. v1 also sent `db_name: ""`; the server drops it and never
 * returns one.
 */
export class ViewField extends Deneric {
  readonly className = FieldClass.View;
  viewName = '';
  fieldName = '';
  fieldType = '';

  constructor(json?: unknown) {
    super({
      viewName: ['view_name', String],
      fieldName: ['field_name', String],
      fieldType: ['field_type', String]
    });
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return { class_name: this.className, ...(super.toJson() as Record<string, unknown>) };
  }
}

export type Field = TableField | ViewField;

/** Picks the class from `class_name`; another kind of field gives `undefined`. */
export function parseField(json: unknown): Field | undefined {
  const className = (json as { class_name?: unknown } | null | undefined)?.class_name;
  switch (className) {
    case FieldClass.Table:
      return new TableField(json);
    case FieldClass.View:
      return new ViewField(json);
    default:
      return undefined;
  }
}
