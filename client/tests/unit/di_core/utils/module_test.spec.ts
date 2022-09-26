import { DevModule, DI, TestModule } from '@core/modules';
import { expect } from 'chai';
import { DashboardService } from '@core/services/DashboardService';
import { Log } from '@core/utils';

describe('Dependence Injection', () => {
  before(() => {
    DI.init([new DevModule(), new TestModule()]);
  });

  it('should get value existed in DI', () => {
    const value = DI.get<string>('init_project');
    Log.debug(value);
    expect(value).eq('Hello world');
  });
  it('should get value not define', () => {
    const value = DI.get<string>('project');
    Log.debug(value);
    expect(value).undefined;
  });
  it('should get value with key is object', () => {
    const service = DI.get<DashboardService>(DashboardService);
    Log.debug('Typeof service::', typeof service);
    expect(service).exist;
  });
});
