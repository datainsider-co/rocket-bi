import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType } from '@/shared';
import { ShortInfoTableSchema } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { ChartBuilderResponse } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';

export class ScatterPromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Task:
    - Identify the xAxis and functions required for a scatter table..
    - Identify the yAxis and functions required for a scatter table..
    - Identify the legend (optional) and functions for a scatter table..
    - Optional: Specify sorting based on scatter config.
    Output Format (JSON):
    + "xAxis", "yAxis", "legendOptional": An array of objects, each with:
    - "displayName": Name to display.\n
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    - If one of the columns uses the "Group By" functionFamily, and other columns are of the number data type, then the number columns will automatically use the "Aggregation" functionFamily.
    + "sorting", An object, each containing:
    - "displayName", "field", "functionFamily", "functionType": similar "xAxis", "yAxis", "legendOptional".
    ${this.sortingPrompt()}
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    return new Map([
      [ConfigType.xAxis, this.createFunctionTreeNode(ConfigType.xAxis, node)],
      [ConfigType.yAxis, this.createFunctionTreeNode(ConfigType.yAxis, node)],
      [ConfigType.legendOptional, this.createFunctionTreeNode(ConfigType.legendOptional, node)],
      [ConfigType.sorting, this.createFunctionTreeNode(ConfigType.sorting, node)]
    ]);
  }

  protected functionFamilyPrompt(): string {
    return `
    - "functionFamily" Determines the type of operation based on the column data type:
      + "Group By" (default for String).
      + "Date histogram" (default for Date).
      + "Aggregation" (default for Numbers).
      + "None" for raw data.\n
    `;
  }
}
