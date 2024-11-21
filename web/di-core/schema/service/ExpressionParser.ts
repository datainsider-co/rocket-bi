/*
 * @author: tvc12 - Thien Vi
 * @created: 4/20/21, 1:51 PM
 */

import { Expression, MaterializedExpression, TableSchema } from '@core/common/domain/model';
import { FormulaException } from '@core/common/domain/exception/FormulaException';
import { Log } from '@core/utils';

export class RawExpressionData {
  public rawExpression: string;
  public currentSelectedTable: TableSchema;

  constructor(rawExpression: string, currentSelectedTable: TableSchema) {
    this.rawExpression = rawExpression;
    this.currentSelectedTable = currentSelectedTable;
  }
}

export type DisplayName = string;
export type FieldName = string;

export class ExpressionParser {
  private static readonly DISPLAY_NAME_PATTERN = new RegExp('\\[(.*?)]', 'gi');
  private static readonly GROUP_INDEX = 0;

  /**
   *  Tạo ra expression từ raw data.
   *
   *  @data RawExpressionData. Cần một rawExpression để parse.
   *
   *  Replace toàn bộ kí tự trong cặp ngoặc [] thành format: FieldName
   *
   *  Sau đó sẽ tạo ra một class MaterializedExpression dựa trên chuỗi expression vừa tạo ra.
   *
   *  @return Expression nếu tạo thành công
   *
   *  @throw FormulaException nếu parse bị lỗi
   *
   *  ex: [Total Profit] -> total_profit
   */
  public static parse(data: RawExpressionData): Expression {
    const mapDisplayNameAndFieldName: Map<DisplayName, FieldName> = data.currentSelectedTable.toMapDisplayNameAndFieldName();
    const expression = this.replaceDisplayNameByFieldName(data.rawExpression, mapDisplayNameAndFieldName);
    return new MaterializedExpression(expression);
  }

  /**
   * Parse expression to formula syntax follow-up: ColumnName -> [DisplayName]
   *
   * @return formula: trả về formula
   * @throw FormulaException khi không thể parse được
   */
  public static bindDisplayNameOfSchema(tableSchema: TableSchema, expression: string): string {
    try {
      let formula = expression;
      tableSchema.toMapFieldNameAndDisplayName().forEach((displayName: DisplayName, fieldName: FieldName) => {
        const regexName = this.buildRegexName(fieldName);
        formula = formula.replaceAll(regexName, `[${displayName}]`);
      });
      return formula;
    } catch (ex) {
      Log.error('toFormula::ex', ex);
      throw new FormulaException('Some syntax invalid in expression');
    }
  }

  private static buildRegexName(name: FieldName): RegExp {
    return new RegExp(`\\b${name}(?!\\()\\b`, 'gim');
  }

  private static replaceDisplayNameByFieldName(text: string, mapDisplayNameAndFieldName: Map<DisplayName, FieldName>): string {
    return text.replaceAll(this.DISPLAY_NAME_PATTERN, (matchedText: string, ...args: any[]) => {
      const displayName: DisplayName | undefined = args[this.GROUP_INDEX]?.trim() ?? matchedText.substr(1, matchedText.length - 1);
      if (displayName) {
        const fieldName: FieldName | undefined = mapDisplayNameAndFieldName.get(displayName);
        if (fieldName) {
          return fieldName;
        } else {
          throw new FormulaException(`Column ${displayName} invalid`);
        }
      } else {
        throw new FormulaException('Syntax in correct');
      }
    });
  }
}
