import { StringUtils } from '@/utils';
import { Log } from '@core/utils';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';

export class SortedFunction {
  private controller: ChatbotController;

  constructor(controller: ChatbotController) {
    this.controller = controller;
  }

  async execute(payload: { type: string; response: any }): Promise<boolean> {
    try {
      await this.init();
      const message = this.buildMessage(payload);
      const messageData = await this.controller.completion(message);
      return this.toResponse(messageData);
    } catch (error) {
      Log.error(error);
      return false;
    }
  }

  toResponse(messageData: ChatMessageData) {
    if (StringUtils.isEmpty(messageData.text)) {
      return false;
    }
    return (messageData.text as string).toLowerCase() === 'true';
  }

  private buildMessage(payload: { type: string; response: any }): ChatMessageData[] {
    const { type, response } = payload;
    return [
      {
        text: `Is the ${type} chart based on date? If not, output true; If base on, is the chart sorted?. Output only true or false. ${JSON.stringify(
          response
        )}`,
        type: MessageType.text,
        role: OpenAiMessageRole.user
      }
    ];
  }

  private init(): Promise<void> {
    if (this.controller.initiated) {
      return Promise.resolve();
    }

    return this.controller.init(this.model);
  }

  private get model(): OpenAiModels {
    return OpenAiModels.Gpt4o;
  }
}
