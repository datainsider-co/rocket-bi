import { BaseModule } from '@core/modules';
import { Container, Scope } from 'typescript-ioc';
import { ShareRepository, ShareRepositoryImpl } from '@core/share/repository/share_repository';
import { ShareService, ShareServiceImpl } from '@core/share/service/share_service';

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
