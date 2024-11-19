import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType } from '@/shared';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { ChartBuilderResponse } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';

export class FlattenTablePromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present bar chart:
    - list of columns and functions  to display as group table.
    - sorting (optional) and function to sort value base on xAxis or yAxis.
    Give me output as a JSON object with arrays of objects.
    The top-level keys in the object should be:
    + "columns", "sorting": An array of objects, each containing:
    - "displayName": name to display.
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    ${this.sortingPrompt()}
    + If one of the columns uses the "Group By" functionFamily, and other columns are of the number data type, then the number columns will automatically use the "Aggregation" functionFamily.
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    return new Map([
      [ConfigType.columns, this.createFunctionTreeNode(ConfigType.columns, node)],
      [ConfigType.sorting, this.createFunctionTreeNode(ConfigType.sorting, node)]
    ]);
  }

  protected functionFamilyPrompt(): string {
    return `
      return \`
    - "functionFamily" (required): The main function key, which defines the type of operation to be performed. The value of functionFamily is determined based on the data type of the column, with the following priority order:
      + "Group By": Represents a grouping operation on the data table.
      + "Date histogram": Represents date-based operations on the data table.
      + "Aggregation": Represents numerical operations on the data table.
      + "None": Represents raw data on the table.
      + If the column data type is String, the default and highest priority function is: None.
      + If the column data type is Date, the default and highest priority function is: None.
      + If the column data type is Number, the default and highest priority function is: None.\n
    \`;
    `;
  }
}
