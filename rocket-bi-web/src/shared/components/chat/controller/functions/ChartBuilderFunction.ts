import { ChatbotController } from '@/screens/dashboard-detail/intefaces/chatbot/ChatbotController';
import { OpenAiModels } from '@/screens/dashboard-detail/intefaces/chatbot/OpenAiModels';
import {
  ChartBuilderResponse,
  ChartPromptFactory,
  ChartPromptRequest
} from '@/screens/dashboard-detail/intefaces/chatbot/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';
import { ChartType } from '@/shared';

export class ChartBuilderFunction {
  private controller: ChatbotController;
  private factory: ChartPromptFactory;

  constructor(controller: ChatbotController, factory: ChartPromptFactory) {
    this.controller = controller;
    this.factory = factory;
  }

  public canExecute(type: ChartType): boolean {
    return this.factory.isBuildable(type);
  }

  async execute(request: ChartPromptRequest): Promise<ChartBuilderResponse> {
    await this.init();
    const messages: ChatMessageData[] = this.factory.generate(request);
    const response: ChatMessageData = await this.controller.completion(messages);
    this.factory.ensureResponse(request.chartType, response);
    return this.factory.parse(request.chartType, response);
  }

  private init(): Promise<void> {
    if (this.controller.initiated) {
      return Promise.resolve();
    }

    return this.controller.init(this.model);
  }

  private get model(): OpenAiModels {
    return OpenAiModels.GPT35Turbo; ///Other models cant forecast
  }
}
