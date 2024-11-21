import { DIException } from '@core/common/domain';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { ChatMessageBuilder } from '@/shared/components/chat/controller/ChatMessageBuilder';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { MessageActionValue } from '@/shared/components/chat/controller/MessageActionValue';

export abstract class ErrorMessageBuilder {
  static getAPIKeyNotFoundMessage(): ChatMessageData | null {
    return new ChatMessageBuilder()
      .withAgent(OpenAiMessageRole.assistant)
      .withMessage('Please add Open AI secret key')
      .withType(MessageType.button)
      .withActions([
        {
          text: 'Add Open AI secret key',
          value: MessageActionValue.addSecretKey,
          action: 'postback'
        },
        {
          text: 'Open AI Keys',
          value: `https://platform.openai.com/api-keys`,
          action: 'url'
        },
        {
          text: 'Try again',
          value: MessageActionValue.tryAgain,
          action: 'postback'
        }
      ])
      .getResult();
  }

  static getQuotaMessage(): ChatMessageData | null {
    return new ChatMessageBuilder()
      .withAgent(OpenAiMessageRole.assistant)
      .withMessage(
        'You exceeded your current quota, please check your plan and billing details. If you add payment method after create secret key, please recreate secret key to use.'
      )
      .withType(MessageType.button)
      .withActions([
        {
          text: 'Go to billing',
          value: 'https://platform.openai.com/settings/organization/billing/overview',
          action: 'url'
        },
        {
          text: 'Try again',
          value: MessageActionValue.tryAgain,
          action: 'postback'
        }
      ])
      .getResult();
  }

  static getMessageFromException(ex: DIException): ChatMessageData | null {
    return new ChatMessageBuilder()
      .withAgent(OpenAiMessageRole.assistant)
      .withMessage(ex.message)
      .withType(MessageType.text)
      .getResult();
  }
}
