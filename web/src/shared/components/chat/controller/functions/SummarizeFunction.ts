import { Log } from '@core/utils';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { DataManager } from '@core/common/services';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';

export class SummarizeFunction {
  private controller: ChatbotController;

  constructor(controller: ChatbotController) {
    this.controller = controller;
  }

  /**
   * Executes a payload and returns the message text.
   *
   * @param {object} payload - The payload object representing the type and response.
   * @param {string} payload.type - The type of the payload.
   * @param {*} payload.response - The response for the payload.
   * @returns {Promise<string>} - The message text.
   * @throws {Error} - If there was an error during execution.
   */
  async execute(payload: { type: string; response: any }): Promise<string> {
    try {
      await this.init();
      const message = this.buildMessage(payload);
      const messageData = await this.controller.completion(message);
      return messageData.text;
    } catch (error) {
      Log.error(error);
      throw error;
    }
  }

  private buildMessage(payload: { type: string; response: any }): ChatMessageData[] {
    const { type, response } = payload;
    return [
      {
        text: `You are a data analyst.
        Summarize and insight of chart provided in about 50 words.
        You will provided 2 triple quotation. The first is "Type of chart", the next is "Chart data" as JSON format to display with "Highcharts" library.`,
        type: MessageType.text,
        role: OpenAiMessageRole.system
      },
      {
        text: `
        '''${type}'''

        '''${JSON.stringify(response)}'''`,
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
    return DataManager.getAssistantModel();
  }
}
