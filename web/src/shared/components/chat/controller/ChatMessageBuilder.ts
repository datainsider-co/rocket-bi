import { StringUtils } from '@/utils';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { MessageAction } from '@/shared/components/chat/controller/MessageAction';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';

export class ChatMessageBuilder {
  private role: OpenAiMessageRole | null = null;
  private message = '';
  private type: MessageType | null = null;
  private actions: MessageAction[] = [];

  withAgent(role: OpenAiMessageRole): ChatMessageBuilder {
    this.role = role;
    return this;
  }

  withMessage(msg: string): ChatMessageBuilder {
    this.message = msg;
    return this;
  }

  withType(type: MessageType): ChatMessageBuilder {
    this.type = type;
    return this;
  }

  withActions(actions: MessageAction[]): ChatMessageBuilder {
    this.actions = actions;
    return this;
  }

  getResult(): ChatMessageData | null {
    if (this.role === null) {
      return null;
    }

    if (StringUtils.isEmpty(this.message)) {
      return null;
    }

    if (this.type === null) {
      return null;
    }
    return {
      role: this.role,
      type: this.type,
      text: this.message,
      options: this.actions
    };
  }
}
