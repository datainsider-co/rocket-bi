import { DevModule, Di, TestModule } from '@core/common/modules';
import { expect } from 'chai';
import { DashboardService } from '@core/common/services/DashboardService';
import { Log } from '@core/utils';

describe('Dependence Injection', () => {
  before(() => {
    Di.init([new DevModule(), new TestModule()]);
  });

  it('should get value existed in DI', () => {
    const value = Di.get<string>('init_project');
    Log.debug(value);
    expect(value).eq('Hello world');
  });
  it('should get value not define', () => {
    const value = Di.get<string>('project');
    Log.debug(value);
    expect(value).undefined;
  });
  it('should get value with key is object', () => {
    const service = Di.get<DashboardService>(DashboardService);
    Log.debug('Typeof service::', typeof service);
    expect(service).exist;
  });
});
