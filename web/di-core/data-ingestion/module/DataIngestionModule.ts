/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:05 PM
 */

import { BaseModule } from '@core/common/modules';
import { Container, Scope } from 'typescript-ioc';
import { DataSourceRepository, DataSourceRepositoryImpl } from '@core/data-ingestion/repository/DataSourceRepository';
import { JobService, JobServiceImpl } from '@core/data-ingestion/service/JobService';
import { JobRepository, JobRepositoryImpl } from '@core/data-ingestion/repository/JobRepository';
import {
  JobHistoryRepository,
  JobHistoryRepositoryImpl,
  JobHistoryService,
  JobHistoryServiceImpl,
  StreamingJobRepository,
  StreamingJobRepositoryImpl,
  StreamingJobService,
  StreamingJobServiceImpl
} from '@core/data-ingestion';
import { DataSourceService, DataSourceServiceImpl } from '@core/common/services/DataSourceService';

export class DataIngestionModule extends BaseModule {
  configuration() {
    this.bindDataSourceModule();
    this.bindJobModule();
    this.bindJobHistoryModule();
    this.bindStreamingJobModule();
  }

  private bindDataSourceModule() {
    Container.bind(DataSourceService)
      .to(DataSourceServiceImpl)
      .scope(Scope.Singleton);
    Container.bind(DataSourceRepository)
      .to(DataSourceRepositoryImpl)
      .scope(Scope.Singleton);
  }

  private bindJobModule() {
    Container.bind(JobService)
      .to(JobServiceImpl)
      .scope(Scope.Singleton);
    Container.bind(JobRepository)
      .to(JobRepositoryImpl)
      .scope(Scope.Singleton);
  }

  private bindStreamingJobModule() {
    Container.bind(StreamingJobRepository)
      .to(StreamingJobRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(StreamingJobService)
      .to(StreamingJobServiceImpl)
      .scope(Scope.Singleton);
  }

  private bindJobHistoryModule() {
    Container.bind(JobHistoryRepository)
      .to(JobHistoryRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(JobHistoryService)
      .to(JobHistoryServiceImpl)
      .scope(Scope.Singleton);
  }
}
