import { InlineSqlView, SqlQuery, TableSchema } from '@core/domain';

export enum QueryViews {
  Table = 'table_view',
  SQL = 'sql_view'
}

export abstract class QueryView {
  abstract className: QueryViews;
  abstract aliasName: string;

  static fromObject(obj: QueryView) {
    switch (obj.className) {
      case QueryViews.Table: {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new TableView((obj as TableView).dbName, (obj as TableView).tblName, obj.aliasName);
      }
      case QueryViews.SQL:
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new InlineSqlView(obj.aliasName, (obj as InlineSqlView).query);
    }
  }

  static default() {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new TableView('', '', '');
  }

  static isTableView(view: QueryView) {
    return view.className === QueryViews.Table;
  }
}

export class TableView implements QueryView {
  className = QueryViews.Table;
  constructor(public dbName: string, public tblName: string, public aliasName: string) {}

  static fromObject(obj: TableView) {
    return new TableView(obj.dbName, obj.tblName, obj.aliasName);
  }
}
