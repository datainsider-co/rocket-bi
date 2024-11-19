import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType, FunctionTreeNode } from '@/shared';
import { ShortInfoTableSchema } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { ChartBuilderResponse } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { Log } from '@core/utils';

export class SeriesPromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present line chart:
    - xAxis and function  to display as line.
    - yAxis and function to display value of line.
    - legend (optional) and function to display break of xAxis.
    - sorting (optional) and function to sort value base on xAxis or yAxis.
    Give me output as JSON.
    - Top keys name: "xAxis", "yAxis", "legendOptional", "sorting" contains:
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
      [ConfigType.sorting, sorting]
    ]);
  }
}
