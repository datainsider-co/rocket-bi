import { MessageType } from './MessageType';
import { MessageAction } from './MessageAction';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';

export interface ChatMessageData {
  role: OpenAiMessageRole;
  type: MessageType;
  text: string;
  disableInput?: boolean;
  action?: string; ///Works with type is button
  options?: MessageAction[];
  createdAt?: number;
}
