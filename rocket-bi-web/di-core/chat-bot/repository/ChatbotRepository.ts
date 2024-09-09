import { OpenAiMessage } from '@core/chat-bot/domain/OpenAiMessage';
import { DIKeys } from '@core/common/modules';
import { InjectValue } from 'typescript-ioc';
import { BaseClient } from '@core/common/services';
import { get } from 'lodash';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';

export abstract class ChatbotRepository {
  abstract completions(messages: OpenAiMessage[], payload: { model: string; key: string }): Promise<OpenAiMessage>;
}

export class ChatbotRepositoryImpl extends ChatbotRepository {
  @InjectValue(DIKeys.OpenAiClient)
  private httpClient!: BaseClient;

  completions(messages: OpenAiMessage[], payload: { model: string; key: string }): Promise<OpenAiMessage> {
    return this.httpClient
      .post(
        '/v1/chat/completions',
        {
          model: payload.model,
          messages: messages
        },
        {},
        {
          authorization: `Bearer ${payload.key}`
        }
      )
      .then(res => {
        return get(res, 'choices[0].message', { role: OpenAiMessageRole.assistant, content: '' });
      });
  }
}
