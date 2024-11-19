import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType, FunctionTreeNode } from '@/shared';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { ChartBuilderResponse } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { Log } from '@core/utils';

export class PiePromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present pie chart:
    - legend and function to display as label.
    - value and function to display value.
    - sorting (optional) and function to sort value base on xAxis or yAxis.
    Give me output as JSON.
    - Top keys name: "legend", "value", "sorting" contains:
    - "displayName": name to display.
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    ${this.sortingPrompt()}
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    const legend: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.legend, node);
    const value: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.value, node);
    const sorting: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.sorting, node);
    return new Map([
      [ConfigType.legend, legend],
      [ConfigType.value, value],
      [ConfigType.sorting, sorting]
    ]);
  }
}
