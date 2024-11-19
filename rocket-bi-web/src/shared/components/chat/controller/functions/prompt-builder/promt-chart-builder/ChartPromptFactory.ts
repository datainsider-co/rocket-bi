import { ChartType, ConfigType, FunctionTreeNode } from '@/shared';
import { DIException } from '@core/common/domain';
import { PromptBuilder } from '../PromptBuilder';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ShortInfoTableSchema } from '@/screens/chart-builder/prompt-2-chart/ChartGenerator';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { MessageType } from '@/screens/dashboard-detail/intefaces/chatbot/MessageType';
import { ChartPromptGenerator } from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/chart-prompt-generator/ChartPromptGenerator';
import { StringUtils } from '@/utils';

export interface ChartPromptRequest {
  chartType: ChartType;
  tableSchema: ShortInfoTableSchema;
  prompt: string;
}

export type ChartBuilderResponse = Map<ConfigType, FunctionTreeNode[]>;

export abstract class ChartPromptFactory extends PromptBuilder<ChartPromptRequest> {
  abstract isBuildable(type: ChartType): boolean;

  abstract ensureResponse(type: ChartType, response: ChatMessageData): void;

  abstract parse(type: ChartType, response: ChatMessageData): ChartBuilderResponse;
}

export class ChartPromptFactoryImpl extends ChartPromptFactory {
  private readonly chartHandlers: Map<ChartType, ChartPromptGenerator>;

  constructor(chartHandlers: Map<ChartType, ChartPromptGenerator>) {
    super();
    this.chartHandlers = chartHandlers;
  }

  isBuildable(type: ChartType): boolean {
    return this.chartHandlers.has(type);
  }

  generate(data: ChartPromptRequest): ChatMessageData[] {
    return [this.buildSystemChartMessage(data), this.buildUserMessage(data)].flat();
  }

  private buildUserMessage(data: ChartPromptRequest): ChatMessageData {
    return {
      role: OpenAiMessageRole.user,
      type: MessageType.text,
      text: `
        Database Schema:
        ===
        ${JSON.stringify(data.tableSchema)}
        ===
        Question:
        ===
        ${data.prompt}
        ===
      `
    };
  }

  private buildSystemChartMessage(data: ChartPromptRequest): ChatMessageData {
    const { chartType, tableSchema } = data;
    this.ensureBuildable(chartType);
    return {
      role: OpenAiMessageRole.system,
      type: MessageType.text,
      text: `
      ${this.buildContextMessage(data)}
      ${this.chartHandlers.get(chartType)!.generate(tableSchema)}
      ${this.buildErrorHandling()}
      `
    };
  }

  private buildContextMessage(data: ChartPromptRequest): string {
    const { chartType } = data;
    return `
    You are a data analyst and your task is to create a ${chartType} chart.
    Input Constructions:
    - Database Schema: Provided as JSON within triple backticks:
    + database_name: Name of the database (e.g., sample).
    + table_name: Name of the table (e.g., sale).
    + fields: Array of columns with:
        * name: Column name.
        * type: Column type (String, Date, Double, Float, Int).
    - Question: question for analyze.
    `;
  }

  private buildErrorHandling(): string {
    return `
    If question is not related with Database Schema Constructions. Give me output as JSON:
     - "message": A specific explanation of why the request cannot be processed.
     - "reason": A detail error message describing the issue.
    `;
  }

  ensureResponse(type: ChartType, response: ChatMessageData): void {
    this.ensureBuildable(type);
    this.ensureValidChatResponse(response);
    return this.chartHandlers.get(type)!.ensureResponse(response);
  }

  private ensureBuildable(type: ChartType) {
    if (!this.isBuildable(type)) {
      throw new DIException(`Chart ${type} is not support AI`);
    }
  }

  parse(type: ChartType, response: ChatMessageData): ChartBuilderResponse {
    this.ensureBuildable(type);
    return this.chartHandlers.get(type)!.parse(response);
  }

  private ensureValidChatResponse(response: ChatMessageData) {
    const responseAsJson = StringUtils.convertToJson(response.text);

    if (!responseAsJson) {
      throw new DIException('Failed to retrieve data. Please try again.');
    }

    const message = responseAsJson['message'];
    const reason = responseAsJson['reason'];

    if (!!message && !!reason) {
      throw new DIException(message, 500, reason);
    }
  }
}
