import { QueryView, QueryViews } from '@core/data-relationship';

export class SqlQuery {
  readonly className = 'sql_query';
  query: string;
  encryptKey?: string | null;

  constructor(query: string, encryptKey?: string | null) {
    this.query = query;
    this.encryptKey = encryptKey;
  }

  static fromObject(obj: any): SqlQuery {
    return new SqlQuery(obj.query, obj.encryptKey);
  }
}

export class InlineSqlView implements QueryView {
  readonly className = QueryViews.SQL;
  aliasName: string;
  query: SqlQuery;

  constructor(aliasName: string, query: SqlQuery) {
    this.aliasName = aliasName;
    this.query = query;
  }

  static fromObject(obj: any): InlineSqlView {
    return new InlineSqlView(obj.aliasName, SqlQuery.fromObject(obj.query));
  }
}
