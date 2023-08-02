import { Container, Scope } from 'typescript-ioc';
import { TrackingService, TrackingServiceImpl } from '@core/tracking/service/TrackingService';
import { TrackingActivityService, TrackingActivityServiceImpl, TrackingProfileService, TrackingProfileServiceImpl } from '@core/tracking/service';
import { BaseModule } from '@core/common/modules';
import DiAnalytics from 'di-web-analytics';
import { TrackingProfileRepository, TrackingProfileRepositoryImpl } from '@core/tracking/repository/TrackingProfileRepository';
import { TrackingActivityRepository, TrackingActivityRepositoryImpl } from '@core/tracking/repository/TrackingActivityRepository';

export class TrackingModule extends BaseModule {
  configuration(): void {
    DiAnalytics.init('https://analytics.datainsider.co', 'di_api_7dc8dd96-611a-4116-a506-1ba89713fbe6');

    Container.bind(TrackingService)
      .to(TrackingServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(TrackingProfileRepository)
      .to(TrackingProfileRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(TrackingProfileService)
      .to(TrackingProfileServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(TrackingActivityRepository)
      .to(TrackingActivityRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(TrackingActivityService)
      .to(TrackingActivityServiceImpl)
      .scope(Scope.Singleton);
  }
}
