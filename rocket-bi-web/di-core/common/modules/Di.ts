import { BaseModule } from './index';
import { Container } from 'typescript-ioc';

export type OtherType<T> = Function & { prototype: T };

export abstract class Di {
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
  CaasClient = 'caas_client',
  BiClient = 'bi_client',
  SchemaClient = 'schema_client',
  CdpClient = 'cdp_client',
  StaticClient = 'static_client',
  DataCookClient = 'data_cook_client',
  BillingClient = 'billing_client',
  WorkerClient = 'worker_client',
  SchedulerClient = 'scheduler_client',
  RelayClient = 'relay_client',
  Profiler = 'profiler',
  NoAuthService = 'no_auth_service',
  AuthService = 'auth_service',
  CompareBuilder = 'compare_builder'
}
