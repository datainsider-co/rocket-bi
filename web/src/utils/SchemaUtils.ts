import {
  CalculationField,
  Column,
  Condition,
  DatabaseInfo,
  ExpressionField,
  Field,
  GroupedTableQuerySetting,
  NestedColumn,
  QuerySetting,
  Select,
  ShortDatabaseInfo,
  TableColumn,
  TableSchema
} from '@core/common/domain/model';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { IconUtils } from '@/utils/IconUtils';
import { ConditionTreeNode, FunctionTreeNode, GroupedField, SelectOption } from '@/shared';
import { ChartUtils } from '@/utils/ChartUtils';
import { ListUtils } from '@/utils/ListUtils';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { DropdownData, DropdownType } from '@/shared/components/common/di-dropdown';
import { StringUtils } from '@/utils/StringUtils';

export abstract class SchemaUtils {
  static toTableSchemaNodes(databaseSchema: DatabaseInfo, isExpanded = false): SlTreeNodeModel<TableSchema>[] {
    return databaseSchema.tables.map(table => {
      return {
        title: table.displayName,
        tag: table,
        data: table,
        isExpanded: isExpanded,
        isLeaf: false,
        children: this.getTableAsNodes(table)
      };
    });
  }

  static buildFieldsFromTableSchemas(tables: TableSchema[]): FieldDetailInfo[] {
    return tables.map(table => this.buildFieldsFromTableSchema(table)).flat();
  }

  static buildDateFieldsFromTableSchemas(tables: TableSchema[]): FieldDetailInfo[] {
    return tables
      .map(table => this.buildFieldsFromTableSchema(table))
      .flat()
      .filter(profileField => ChartUtils.isDateType(profileField.field.fieldType));
  }

  static buildFieldsFromTableSchema(table: TableSchema): FieldDetailInfo[] {
    const result: FieldDetailInfo[] = [];
    table.columns.forEach(col => {
      if (col instanceof NestedColumn) {
        const nestedCols: FieldDetailInfo[] = [];
        col.nestedColumns.map(nestedCol => {
          const field = Field.new(table.dbName, table.name, `\`${col.name}.${nestedCol.name}\``, nestedCol.className);
          nestedCols.push(new FieldDetailInfo(field, nestedCol.name, nestedCol.displayName, true));
        });
        result.push(...nestedCols);
      } else {
        const field = Field.new(table.dbName, table.name, col.name, col.className);
        result.push(new FieldDetailInfo(field, col.name, col.displayName, false));
      }
    });
    return result;
  }

  static search(options: SelectOption[], searchString?: string | null): SelectOption[] {
    const searchStringLowerCase = (searchString ?? '').toLocaleLowerCase().trim();

    return options.filter(option => {
      return this.isIncludes(searchStringLowerCase, option.displayName.toLocaleLowerCase());
    });
  }

  static searchGroupedFields(groupedFields: GroupedField[], searchString?: string | null): GroupedField[] {
    const searchStringLowerCase = (searchString ?? '').toLocaleLowerCase();

    return groupedFields
      .map(groupedField => {
        const newChildren = groupedField.children.filter(profileField => {
          return this.isIncludes(searchStringLowerCase, profileField.displayName.toLocaleLowerCase());
        });
        return {
          groupTitle: groupedField.groupTitle,
          children: newChildren
        };
      })
      .filter(group => ListUtils.isNotEmpty(group.children));
  }

  static isNested(tableName: string): boolean {
    return tableName.includes('.');
  }

  static sortDatabaseInfos(databases: DatabaseInfo[]): DatabaseInfo[] {
    return databases.sort((databaseA: DatabaseInfo, databaseB: DatabaseInfo) => {
      const displayNameA: string = databaseA.displayName || databaseA.name || '';
      const displayNameB: string = databaseB.displayName || databaseB.name || '';
      return StringUtils.compare(displayNameA, displayNameB);
    });
  }

  static sort(databaseSchema: DatabaseInfo): DatabaseInfo {
    databaseSchema.tables = this.sortTables(databaseSchema.tables);
    return databaseSchema;
  }

  static sortTables(tables: TableSchema[]): TableSchema[] {
    return tables
      .map(table => {
        table.columns = this.sortColumns(table.columns);
        return table;
      })
      .sort((tableA, tableB) => tableA.displayName.localeCompare(tableB.displayName));
  }

  static sortColumns(columns: Column[]): Column[] {
    return columns.sort((columnA, columnB) => columnA.displayName.localeCompare(columnB.displayName));
  }

  static toFieldDetailInfoOptions(schema: DatabaseInfo, filter?: (column: Column) => boolean): DropdownData[] {
    return schema.tables
      .sort((a, b) => StringUtils.compare(a.displayName, b.displayName))
      .map(table => {
        return {
          type: DropdownType.Group,
          displayName: table.displayName,
          options: table.columns
            .sort((a, b) => StringUtils.compare(a.displayName, b.displayName))
            .filter(column => (filter ? filter(column) : true))
            .map(column => {
              return new FieldDetailInfo(
                Field.new(schema.name, table.name, column.name, column.className),
                column.name,
                column.displayName,
                SchemaUtils.isNested(table.name),
                false
              );
            })
        };
      })
      .filter(table => ListUtils.isNotEmpty(table.options));
  }

  static getTableAsNodes(table: TableSchema): SlTreeNodeModel<TableSchema>[] {
    const columnAsNodes = table.columns.map((col: Column) => {
      if (col instanceof NestedColumn) {
        return {
          title: col.displayName,
          isLeaf: false,
          isExpanded: false,
          tag: table,
          data: table,
          children: this.getNestedColumnsAsNodes(table, col)
        };
      } else {
        return this.getColumnAsNode(table, col, false);
      }
    });
    const measureColumnsAsNodes = table.expressionColumns.map((col: Column) => {
      const expressionField = new ExpressionField(table.dbName, table.name, col.name, col.className, col.defaultExpression?.expr ?? '');
      return {
        ...this.getColumnAsNode(table, col, false, '', '', expressionField),
        extraData: {
          isMeasure: true
        }
      };
    });
    const calculatedColumnsAsNodes = table.calculatedColumns.map((col: Column) => {
      const field = new CalculationField(table.dbName, table.name, col.name, col.className, col.defaultExpression?.expr ?? '');
      return {
        ...this.getColumnAsNode(table, col, false, '', '', field),
        extraData: {
          isCalculated: true
        }
      };
    });
    return [...columnAsNodes, ...measureColumnsAsNodes, ...calculatedColumnsAsNodes];
  }

  private static getNestedColumnsAsNodes(parentTable: TableSchema, nestedColumn: NestedColumn): SlTreeNodeModel<TableSchema>[] {
    if (nestedColumn.nestedColumns) {
      return nestedColumn.nestedColumns.map(innerColumn => {
        return this.getColumnAsNode(parentTable, innerColumn, true, `\`${nestedColumn.name}.${innerColumn.name}\``);
      });
    } else {
      return [];
    }
  }

  private static getColumnAsNode(
    parentTable: TableSchema,
    col: Column,
    isNested: boolean,
    columnName = '',
    title = '',
    field?: Field
  ): SlTreeNodeModel<TableSchema> {
    return {
      title: title || col.displayName,
      isLeaf: true,
      isNested: false,
      icon: IconUtils.getIconComponent(col),
      tag: field || Field.new(parentTable.dbName, parentTable.name, columnName || col.name, col.className),
      column: col,
      data: parentTable
    } as SlTreeNodeModel<TableSchema>;
  }

  private static isIncludes(searchString: string, str: string): boolean {
    if (!searchString) {
      return true;
    } else {
      return str.toLocaleLowerCase().includes(searchString);
    }
  }

  static getFieldName(conditionTreeNode: ConditionTreeNode | FunctionTreeNode) {
    const tableDisplayName = conditionTreeNode.parent.title;
    const columnDisplayName = conditionTreeNode.title;
    return `${tableDisplayName}.${columnDisplayName}`;
  }

  static buildQuery(table: TableSchema, filters?: Condition[]): QuerySetting {
    const fieldInfos: FieldDetailInfo[] = SchemaUtils.buildFieldsFromTableSchema(table);
    const columns: TableColumn[] = fieldInfos.map(fieldInfo => {
      return new TableColumn(fieldInfo.displayName, new Select(fieldInfo.field), false, false, false);
    });
    return new GroupedTableQuerySetting(columns, filters);
  }

  /**
   * merge source database infos to dest database infos.
   * if dest database info is not exist, add it.
   * if source database info is not exist, remove it.
   * if source & dest database info is exist, keep it.
   */
  static mergeDatabaseInfos(sourceDatabaseInfos: ShortDatabaseInfo[], destDatabaseInfos: DatabaseInfo[]): DatabaseInfo[] {
    const destDatabaseInfoMap: Map<string, DatabaseInfo> = new Map();
    destDatabaseInfos.forEach(destDatabaseInfo => {
      destDatabaseInfoMap.set(destDatabaseInfo.name, destDatabaseInfo);
    });

    return sourceDatabaseInfos.map(sourceDatabaseInfo => {
      if (destDatabaseInfoMap.has(sourceDatabaseInfo.name)) {
        return destDatabaseInfoMap.get(sourceDatabaseInfo.name)! as DatabaseInfo;
      } else {
        return sourceDatabaseInfo as DatabaseInfo;
      }
    });
  }
}
