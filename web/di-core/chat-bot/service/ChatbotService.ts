import { OpenAiMessage } from '../domain/OpenAiMessage';
import { Inject } from 'typescript-ioc';
import { ChatbotRepository } from '../repository/ChatbotRepository';

export abstract class ChatbotService {
  abstract completions(messages: OpenAiMessage[], payload: { model: string; key: string }): Promise<OpenAiMessage>;
}

export class OpenAiChatbotService implements ChatbotService {
  @Inject
  private repository!: ChatbotRepository;

  completions(messages: OpenAiMessage[], payload: { model: string; key: string }): Promise<OpenAiMessage> {
    return this.repository.completions(messages, payload);
  }
}
