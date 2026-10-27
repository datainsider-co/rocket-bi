import Deneric from 'deneric2';

/** Values of the backend's `QueryView.class_name`. */
export const QueryViewType = {
  Table: 'table_view',
  Sql: 'sql_view'
} as const;

export type QueryViewType = (typeof QueryViewType)[keyof typeof QueryViewType];

/**
 * Backend `SqlQuery`. The server adds `rls_conditions`, `expressions`, `parameters` and `all_query_views` when it
 * stores one; it derives them from `query`, so they are not kept (v1 dropped them too).
 */
export class SqlQuery extends Deneric {
  query = '';
  encryptKey = '';

  constructor(json?: unknown) {
    super({
      query: ['query', String],
      encryptKey: ['encrypt_key', String]
    });
    this.fromJson(json);
  }

  /** `encrypt_key` only when there is one: v1 sent it only for encrypted queries. */
  override toJson(): Record<string, unknown> {
    return {
      class_name: 'sql_query',
      query: this.query,
      ...(this.encryptKey ? { encrypt_key: this.encryptKey } : {})
    };
  }
}

/** A database table. The server fills in `alias_name` (`tbl_xxxxxx`) when it stores one. */
export class TableView extends Deneric {
  readonly className = QueryViewType.Table;
  dbName = '';
  tblName = '';
  aliasName = '';

  constructor(json?: unknown) {
    super({
      dbName: ['db_name', String],
      tblName: ['tbl_name', String],
      aliasName: ['alias_name', String]
    });
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return { class_name: this.className, ...(super.toJson() as Record<string, unknown>) };
  }
}

/** A SQL query used as a table, named by `alias_name` (v1 `InlineSqlView`). */
export class SqlView extends Deneric {
  readonly className = QueryViewType.Sql;
  aliasName = '';
  query = new SqlQuery();

  constructor(json?: unknown) {
    super({
      aliasName: ['alias_name', String],
      query: ['query', SqlQuery]
    });
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return { class_name: this.className, alias_name: this.aliasName, query: this.query.toJson() };
  }
}

export type QueryView = TableView | SqlView;

/** Picks the class from `class_name`; another kind of view gives `undefined`. */
export function parseQueryView(json: unknown): QueryView | undefined {
  const className = (json as { class_name?: unknown } | null | undefined)?.class_name;
  switch (className) {
    case QueryViewType.Table:
      return new TableView(json);
    case QueryViewType.Sql:
      return new SqlView(json);
    default:
      return undefined;
  }
}
