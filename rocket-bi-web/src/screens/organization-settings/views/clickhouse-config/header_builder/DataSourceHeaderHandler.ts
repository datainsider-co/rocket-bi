import { DataSource } from '@core/clickhouse-config';
import { HeaderData } from '@/shared/models';

export abstract class DataSourceHeaderHandler<T extends DataSource> {
  abstract buildHeader(source: T): HeaderData[];

  abstract getIcon(): string;
}
