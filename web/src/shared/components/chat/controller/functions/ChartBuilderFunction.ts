import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { ChartType } from '@/shared';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import {
  ChartBuilderResponse,
  ChartPromptFactory,
  ChartPromptRequest
} from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';

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
