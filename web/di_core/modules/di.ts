import { BaseModule } from './index';
import { Container } from 'typescript-ioc';

export type OtherType<T> = Function & { prototype: T };

export abstract class DI {
  static init(modules: BaseModule[]): void {
    modules.forEach(module => module.configuration());
  }

  static get<T>(key: string | OtherType<T>): T {
    if (typeof key === 'string') {
      return Container.getValue(key);
    } else {
      return Container.get<T>(key);
    }
  }
}

export enum DIKeys {
  initProject = 'init_project',
  guest = 'guest',
  profiler = 'profiler',
  noAuthClient = 'no_auth_client',
  authClient = 'auth_client',
  apiHost = 'api_host',
  lakeApiHost = 'lake_api_host',
  staticHost = 'static_host',
  noAuthService = 'no_auth_service',
  authService = 'auth_service',
  guestService = 'guest_service',
  compareBuilder = 'compare_builder',
  LakeHouseClient = 'lake_house_client'
}
