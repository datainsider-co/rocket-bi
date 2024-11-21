import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ConfigType, FunctionTreeNode } from '@/shared';
import { ShortInfoTableSchema } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { ChartBuilderResponse } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { Log } from '@core/utils';

export class MapPromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present Map chart:
    - location and function to display as label.
    - value and function to display value.
    - sorting (optional) and function to sort value base on xAxis or yAxis.
    Give me output as JSON.
    - Top keys name: "legend", "value", "sorting" contains:
    - "displayName": name to display.
    ${this.sortingPrompt()}
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    return new Map([
      [ConfigType.location, this.createFunctionTreeNode(ConfigType.location, node)],
      [ConfigType.value, this.createFunctionTreeNode(ConfigType.value, node)],
      [ConfigType.sorting, this.createFunctionTreeNode(ConfigType.sorting, node)]
    ]);
  }
}
