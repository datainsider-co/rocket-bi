import { OpenAiMessage } from '@core/chat-bot/domain/OpenAiMessage';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';

export abstract class PromptBuilder<T> {
  abstract generate(data: T): ChatMessageData[];
}
