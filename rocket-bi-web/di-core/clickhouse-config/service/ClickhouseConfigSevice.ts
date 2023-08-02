import { Inject } from 'typescript-ioc';
import { ClickhouseConfigRepository, DataSource, RefreshSchemaHistory } from '@core/clickhouse-config';

export abstract class ClickhouseConfigService {
  abstract testConnection(source: DataSource): Promise<boolean>;
  abstract refreshSchema(): Promise<boolean>;

  abstract checkExistedSource(): Promise<boolean>;
  abstract getSource(): Promise<DataSource>;
  abstract setSource(source: DataSource): Promise<DataSource>;
  abstract getStatus(): Promise<RefreshSchemaHistory>;
  abstract getSetupStep(): Promise<{ stepConfig: boolean; stepSetup: boolean; haveSource: boolean }>;
}

export class ClickhouseConfigServiceImpl extends ClickhouseConfigService {
  @Inject
  private repository!: ClickhouseConfigRepository;

  refreshSchema(): Promise<boolean> {
    return this.repository.refreshSchema();
  }

  testConnection(source: DataSource): Promise<boolean> {
    return this.repository.testConnection(source);
  }

  checkExistedSource(): Promise<boolean> {
    return this.repository.checkExistedSource();
  }

  setSource(source: DataSource): Promise<DataSource> {
    return this.repository.setSource(source);
  }

  getSource(): Promise<DataSource> {
    return this.repository.getSource();
  }

  getStatus(): Promise<RefreshSchemaHistory> {
    return this.repository.getStatus();
  }

  async getSetupStep(): Promise<{ stepConfig: boolean; stepSetup: boolean; haveSource: boolean }> {
    const isExistedSource = await this.checkExistedSource();
    const schemaHistory = await this.getStatus();
    let stepConfig = false;
    let stepSetup = false;
    let haveSource = false;
    if (isExistedSource) {
      haveSource = true;
    }
    if (isExistedSource && schemaHistory.isFirstRun && schemaHistory.isRunning) {
      stepSetup = true;
    }

    if (!isExistedSource || (isExistedSource && schemaHistory.isFirstRun && schemaHistory.isError)) {
      stepConfig = true;
    }
    return { stepConfig, stepSetup, haveSource };
  }
}
