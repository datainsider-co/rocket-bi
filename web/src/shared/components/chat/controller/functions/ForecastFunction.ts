import { DIException, VisualizationResponse } from '@core/common/domain';
import { ApiExceptions } from '@/shared';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { SortedFunction } from '@/shared/components/chat/controller/functions/SortedFunction';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';

export class ForecastFunction {
  private controller: ChatbotController;
  private sortedFunction: SortedFunction;

  constructor(controller: ChatbotController, sortedFunction: SortedFunction) {
    this.controller = controller;
    this.sortedFunction = sortedFunction;
  }

  async execute(payload: { type: string; response: any; format: any }): Promise<VisualizationResponse> {
    await this.init();
    // const isSorted = await this.sortedFunction.execute(payload);
    // Log.debug('ForecastFunction::isSorted::', isSorted);
    // if (!isSorted) {
    //   throw DIException.fromObject(this.unSortedJsonError);
    // }

    const message = this.buildForecastMessage(payload);
    const messageData = await this.controller.completion(message);
    return VisualizationResponse.fromObject(this.toResponse(messageData));
  }

  toResponse(messageData: ChatMessageData) {
    if (!messageData.text.includes('```json', 0)) {
      throw DIException.fromObject(this.parseJsonError);
    }
    const json: any = JSON.parse(this.processMessageResult(messageData.text));

    if (DIException.isDiException(json)) {
      throw DIException.fromObject(json);
    }

    return json;
  }

  private processMessageResult(text: string): string {
    return text
      .replaceAll('```json', '')
      .replaceAll('```', '')
      .trim();
  }

  private init(): Promise<void> {
    if (this.controller.initiated) {
      return Promise.resolve();
    }

    return this.controller.init(this.model);
  }

  private buildForecastMessage(payload: { type: string; response: any; format: any }): ChatMessageData[] {
    return [
      {
        text: `Can you forecast the next three points with linear extrapolation. JSON output only with formatted as follows. ${JSON.stringify(
          payload.format
        )}. ${payload.type} chart with response ${JSON.stringify(payload.response)}`,
        type: MessageType.text,
        role: OpenAiMessageRole.user
      }
    ];
  }

  private get unSortedJsonError(): any {
    return {
      message: 'Please sort your data for forecast',
      statusCode: 400,
      reason: ApiExceptions.badRequest
    };
  }

  private get parseJsonError(): any {
    return {
      message: 'Your data cannot forecast now. Please try again later',
      statusCode: 500,
      reason: ApiExceptions.internalError
    };
  }

  private get model(): OpenAiModels {
    return OpenAiModels.Gpt4o; ///Other models cant forecast
  }
}
