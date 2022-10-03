import { Container, Scope } from 'typescript-ioc';
import { TrackingService, TrackingServiceImpl } from '@core/tracking/service/TrackingService';
import { TrackingActivityService, TrackingActivityServiceImpl, TrackingProfileService, TrackingProfileServiceImpl } from '@core/tracking/service';
import { BaseModule } from '@core/common/modules';
import DiAnalytics from 'di-web-analytics';
import { TrackingProfileRepository, TrackingProfileRepositoryImpl } from '@core/tracking/repository/TrackingProfileRepository';
import { TrackingActivityRepository, TrackingActivityRepositoryImpl } from '@core/tracking/repository/TrackingActivityRepository';

export class TrackingModule extends BaseModule {
  configuration(): void {
    DiAnalytics.init('https://admin.datainsider.co', 'c2c09332-14a1-4eb1-8964-2d85b2a561c8');

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
