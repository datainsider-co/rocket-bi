import { OpenAiMessage } from '@core/chat-bot/domain/OpenAiMessage';
import { ChatMessageData } from '@/screens/dashboard-detail/intefaces/chatbot/ChatMessageData';

export abstract class PromptBuilder<T> {
  abstract generate(data: T): ChatMessageData[];
}
