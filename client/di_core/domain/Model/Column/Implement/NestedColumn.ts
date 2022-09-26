import { Column } from '@core/domain/Model/Column/Column';
import { ColumnType } from '@core/domain/Model';
import { Expression } from '@core/domain/Model/Column/Expression/Expression';

export class NestedColumn extends Column {
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  description?: string;
  className = ColumnType.nested;
  displayName: string;
  name: string;
  nestedColumns: Column[];
  defaultExpression?: Expression;

  constructor(
    displayName: string,
    name: string,
    isNullable: boolean,
    isEncrypted: boolean,
    isPrivate: boolean,
    nestedColumns: Column[],
    description?: string,
    defaultExpression?: Expression
  ) {
    super();
    this.displayName = displayName;
    this.name = name;
    this.nestedColumns = nestedColumns;
    this.description = description;
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: NestedColumn): NestedColumn {
    const rawNestedColumns = obj.nestedColumns || [];
    const nestedColumns = rawNestedColumns.map(item => Column.fromObject(item)).filter((item): item is Column => !!item);
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    return new NestedColumn(obj.displayName, obj.name, obj.isNullable, obj.isEncrypted, obj.isPrivate, nestedColumns, obj.description, defaultExpression);
  }
}
