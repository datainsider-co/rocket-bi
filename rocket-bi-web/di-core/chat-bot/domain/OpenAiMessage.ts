import { OpenAiMessageRole } from './OpenAiMessageRole';

export interface OpenAiMessage {
  role: OpenAiMessageRole;
  content: string;
}
