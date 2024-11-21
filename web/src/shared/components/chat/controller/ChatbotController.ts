import { Di } from '@core/common/modules';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { ChatbotService } from '@core/chat-bot/service/ChatbotService';
import { OpenAiMessage } from '@core/chat-bot/domain/OpenAiMessage';
import { ApiKeyInfo, APIKeyService } from '@core/organization';
import { Log } from '@core/utils';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageType } from '@/shared/components/chat/controller/MessageType';

export abstract class ChatbotController {
  abstract model: string;

  abstract initiated: boolean;

  abstract init(model: OpenAiModels): Promise<void>;

  abstract createSecretKey(key: string): Promise<void>;

  abstract removeSecretKey(): Promise<void>;

  abstract completion(messages: ChatMessageData[]): Promise<ChatMessageData>;
}

export class OpenAiController extends ChatbotController {
  static OPEN_API_KEY = 'open_ai_key';
  static ONE_YEAR_LATER_DURATION = 365 * 24 * 60 * 60 * 1000;
  private apiKey: string | null = null;

  model: OpenAiModels = OpenAiModels.Gpt4Turbo;
  initiated = false;

  async init(model: OpenAiModels): Promise<void> {
    this.initiated = false;
    this.model = model;
    this.apiKey = await this.loadApiKey();
    this.initiated = true;
  }

  async loadApiKey() {
    const apiKeyService = Di.get(APIKeyService);
    const apiKeyInfo: ApiKeyInfo | undefined = (
      await apiKeyService.list({
        keyword: OpenAiController.OPEN_API_KEY
      })
    ).data.find(info => info.displayName === OpenAiController.OPEN_API_KEY);
    if (StringUtils.isNotEmpty(apiKeyInfo?.apiKey)) {
      return apiKeyInfo!.apiKey;
    } else {
      throw new DIException('No user was found.', 500);
    }
  }

  async createSecretKey(key: string): Promise<void> {
    const apiKeyService = Di.get(APIKeyService);

    const keyResponse = await apiKeyService.create({
      displayName: OpenAiController.OPEN_API_KEY,
      permissions: [],
      expiredTimeMs: OpenAiController.ONE_YEAR_LATER_DURATION,
      apiKey: key
    });

    this.apiKey = keyResponse.apiKeyInfo.apiKey;
  }

  async removeSecretKey() {
    try {
      this.ensureApiKey();
      const apiKeyService = Di.get(APIKeyService);
      await apiKeyService.delete(this.apiKey!);
      this.apiKey = null;
    } catch (error) {
      Log.error(error);
    }
  }

  async completion(messages: ChatMessageData[]): Promise<ChatMessageData> {
    this.ensureApiKey();
    const completionResponse: OpenAiMessage = await Di.get(ChatbotService).completions(this.toOpenAIMessages(messages), {
      model: this.model,
      key: this.apiKey!
    });
    return this.buildBotMessage(completionResponse);
  }

  private toOpenAIMessages(messages: ChatMessageData[]): OpenAiMessage[] {
    return messages.map(message => {
      return {
        role: message.role,
        content: message.text
      };
    });
  }

  private buildBotMessage(res: OpenAiMessage): ChatMessageData {
    return {
      role: res.role,
      type: MessageType.text,
      text: res.content
    };
  }

  private ensureApiKey() {
    if (StringUtils.isNotEmpty(this.apiKey)) {
      return;
    }

    throw new DIException('No user was found.', 500);
  }
}
