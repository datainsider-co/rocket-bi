import { DIException, Field } from '@core/common/domain';
import { isArray } from 'lodash';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { StringUtils } from '@/utils';
import { ConfigType, FunctionTreeNode } from '@/shared';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { ChartBuilderResponse } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';

/**
 * Provides a base class for generating chart prompts and parsing responses.
 * @abstract
 */
export abstract class ChartPromptGenerator {
  abstract generate(data: ShortInfoTableSchema): string;

  abstract parse(response: ChatMessageData): ChartBuilderResponse;

  public ensureResponse(response: ChatMessageData): void {
    this.ensureJson(response.text);
    return;
  }

  private ensureJson(text: string) {
    if (!StringUtils.isJson(text)) {
      throw new DIException('Cannot convert to chart. Please try other prompt!');
    }
  }

  protected extractJsonFromResponse(text: string): any {
    return StringUtils.convertToJson(text);
  }

  protected createFunctionTreeNode(configType: ConfigType, node: any): FunctionTreeNode[] {
    if (!node || !node[configType]) {
      return [];
    }

    if (isArray(node[configType])) {
      return node[configType].map(this.fromObjectFunctionTreeNode);
    }

    if (Object.keys(node[configType]).length === 0) {
      return [];
    }

    return [this.fromObjectFunctionTreeNode(node[configType])];
  }

  private fromObjectFunctionTreeNode(item: any): FunctionTreeNode {
    return {
      ...item,
      field: Field.fromObject(item.field),
      parent: _BuilderTableSchemaStore.tableSchemas.find(schema => schema.data?.name === item.field.tblName),
      sorting: item.order
    };
  }

  protected fieldPrompt(): string {
    return `
    - "field": Contains:
    "className": Always "table_field".
    "fieldType": The selected column's type.
    "dbName": Selected database name.
    "tblName": Selected table name.
    "fieldName": Selected column name.\n
    `;
  }

  protected functionFamilyPrompt(): string {
    return `
    - "functionFamily" (required): The main function key, which defines the type of operation to be performed. The value of functionFamily is determined based on the data type of the column, with the following priority order:
      + "Group By": Represents a grouping operation on the data table.
      + "Date histogram": Represents date-based operations on the data table.
      + "Aggregation": Represents numerical operations on the data table.
      + If the column data type is String, the default and highest priority function is: Group By.
      + If the column data type is Date, the default and highest priority function is: Date histogram.
      + If the column data type is Number, the default and highest priority function is: Aggregation.
    `;
  }

  protected functionTypePrompt(): string {
    return `
  - "functionType" (optional): Only required for "Aggregation" or "Date histogram" function families. Options include:
      + If "functionFamily" is "Aggregation", the "functionType" can be one of the following:
        * "Average": Computes the average of the data in the table.
        * "Sum": Computes the total count of data entries in the table.
        * "Count all": Computes the count of distinct data entries in the table.
        * "Minimum": Computes the minimum value in the data table.
        * "Maximum": Computes the maximum value in the data table.
        * "Sum": Computes the sum of the data values in the table.
      + If "functionFamily" is "Date histogram", the "functionType" can be one of the following:
        * Second of: Represents the "Second of" a particular minute.
        * Minute of: Represents the "Minute of" a particular hour.
        * Hour of: Represents the "Hour of" a particular day.
        * Day of: Represents the "Day of" a particular period.
        * Week of: Represents the "Week of" a particular year or month.
        * Month of: Represents the "Month of" a particular year.
        * Quarter of: Represents the "Quarter of" a particular year.
        * Yearly of: Represents the "Yearly of" a given date.
        * Hour of Day: Represents the hour within a 24-hour day format.
        * Day of Week: Represents the day of the week.
        * Day of Month: Represents the day within a month.
        * Day of Year: Represents the day within a year.
        * Month of Year: Represents the month within a year.
        * Year: Represents the year part of a date.
        * Quarter of Year: Represents the quarter within a year.
        * Minute of Hour: Represents the minute within an hour.
        * Second of Minute: Represents the second within a minute.
        * Week of Year: Represents the week number within a year.
        * Second: Represents the second unit in time.
        * Millisecond: Represents the millisecond unit in time.
        * Nanosecond: Represents the nanosecond unit in time.\n
    `;
  }

  protected sortingPrompt() {
    return `
    - "order": This key is required only if the top key is "sorting" and can be one of the following:
      + "Ascending": Display value in Ascending order from a field in the table.
      + "Descending": Display value in Descending order from a field in the table.
    `;
  }
}
