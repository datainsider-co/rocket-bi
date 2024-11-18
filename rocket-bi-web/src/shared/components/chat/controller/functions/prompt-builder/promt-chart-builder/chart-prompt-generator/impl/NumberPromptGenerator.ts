import { ChartPromptGenerator } from '../ChartPromptGenerator';
import { ChartType, ConfigType, FunctionTreeNode } from '@/shared';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { ChartBuilderResponse } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';

export class NumberPromptGenerator extends ChartPromptGenerator {
  generate(_: ShortInfoTableSchema): string {
    return `
    Identify present number chart:
    - value and function  to display as line.
    Give me output as JSON.
    - Top keys name: "value" contains:
    - "displayName": name to display.
    ${this.sortingPrompt()}
    ${this.fieldPrompt()}
    ${this.functionFamilyPrompt()}
    ${this.functionTypePrompt()}
    `;
  }

  parse(response: ChatMessageData): ChartBuilderResponse {
    const node = this.extractJsonFromResponse(response.text);
    return new Map([[ConfigType.value, this.createFunctionTreeNode(ConfigType.value, node)]]);
  }

  protected functionFamilyPrompt(): string {
    return `
    - "functionFamily" (required): The main function key, which defines the type of operation to be performed. The value of functionFamily is determined based on the data type of the column, with the following priority order:
      + "Aggregation": Represents numerical operations on the data table.
    `;
  }
}
