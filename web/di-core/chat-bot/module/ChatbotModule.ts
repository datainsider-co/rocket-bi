import { Container, Scope } from 'typescript-ioc';
import { BaseModule } from '@core/common/modules';
import { ChatbotRepository, ChatbotRepositoryImpl } from '@core/chat-bot/repository/ChatbotRepository';
import { ChatbotService, OpenAiChatbotService } from '@core/chat-bot/service/ChatbotService';

export class ChatbotModule extends BaseModule {
  configuration(): void {
    Container.bind(ChatbotRepository)
      .to(ChatbotRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(ChatbotService)
      .to(OpenAiChatbotService)
      .scope(Scope.Singleton);
  }
}
