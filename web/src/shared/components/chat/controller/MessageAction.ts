import { MessageActionValue } from '@/shared/components/chat/controller/MessageActionValue';

export interface MessageAction {
  text: string;
  value?: MessageActionValue | string;
  action?: 'url' | 'postback';
}
