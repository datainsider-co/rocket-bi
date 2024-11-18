import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType, FunctionTreeNode } from '@/shared';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { ChartBuilderResponse } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';

export class StackSeriesPromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present column chart:
    - xAxis and function  to display as column.
    - yAxis and function to display value of column.
    - stack(breakdown) (optional) and function to display stack of xAxis.
    - legend (optional) and function to display legend of xAxis.
    - sorting (optional) and function to sort value base on xAxis or yAxis.
    Give me output as JSON.
    - Top keys name: "xAxis", "yAxis", "legendOptional", "sorting", "breakdownOptional" contains:
    - "displayName": name to display.
    ${this.sortingPrompt()}
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    const xAxis: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.xAxis, node);
    const yAxis: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.yAxis, node);
    const legend: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.legendOptional, node);
    const sorting: FunctionTreeNode[] = this.createFunctionTreeNode(ConfigType.sorting, node);
    return new Map([
      [ConfigType.xAxis, xAxis],
      [ConfigType.yAxis, yAxis],
      [ConfigType.legendOptional, legend],
      [ConfigType.breakdownOptional, this.createFunctionTreeNode(ConfigType.breakdownOptional, node)],
      [ConfigType.sorting, sorting]
    ]);
  }
}
