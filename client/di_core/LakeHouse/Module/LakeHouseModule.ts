/*
 * @author: tvc12 - Thien Vi
 * @created: 11/10/21, 4:07 PM
 */

import { BaseModule } from '@core/modules';
import {
  FileBrowserRepository,
  FileBrowserRepositoryImpl,
  QueryRepository,
  QueryRepositoryImpl,
  ScheduleRepository,
  ScheduleRepositoryImpl,
  TableManagementRepository,
  TableManagementRepositoryImpl
} from '@core/LakeHouse/Repository';
import { Container, Scope } from 'typescript-ioc';
import {
  FileBrowserService,
  FileBrowserServiceImpl,
  ScheduleService,
  ScheduleServiceImpl,
  TableManagementService,
  TableManagementServiceImpl
} from '@core/LakeHouse/Service';
import { QueryService, QueryServiceImpl } from '@core/LakeHouse/Service/QueryService';
import { LakeJobRepository, LakeJobRepositoryImpl } from '@core/LakeHouse/Repository/LakeJobRepository';
import { LakeJobService, LakeJobServiceImpl } from '@core/LakeHouse/Service/LakeJobService';

export class LakeHouseModule extends BaseModule {
  configuration() {
    Container.bind(FileBrowserRepository)
      .to(FileBrowserRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(FileBrowserService)
      .to(FileBrowserServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(QueryRepository)
      .to(QueryRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(QueryService)
      .to(QueryServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(TableManagementRepository)
      .to(TableManagementRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(TableManagementService)
      .to(TableManagementServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(ScheduleRepository)
      .to(ScheduleRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(ScheduleService)
      .to(ScheduleServiceImpl)
      .scope(Scope.Singleton);

    Container.bind(LakeJobRepository)
      .to(LakeJobRepositoryImpl)
      .scope(Scope.Singleton);
    Container.bind(LakeJobService)
      .to(LakeJobServiceImpl)
      .scope(Scope.Singleton);
  }
}
