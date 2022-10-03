import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { ShareRepository, ShareRepositoryImpl } from '@core/share/repository/ShareRepository';
import { ShareService, ShareServiceImpl } from '@core/share/service/ShareService';

export class ShareModule extends BaseModule {
  configuration() {
    Container.bind(ShareRepository)
      .to(ShareRepositoryImpl)
      .scope(Scope.Singleton);

    Container.bind(ShareService)
      .to(ShareServiceImpl)
      .scope(Scope.Singleton);
  }
}
