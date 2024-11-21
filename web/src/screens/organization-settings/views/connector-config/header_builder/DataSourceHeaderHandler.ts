import { Connector } from '@core/connector-config';
import { HeaderData } from '@/shared/models';

export abstract class DataSourceHeaderHandler<T extends Connector> {
  abstract buildHeader(source: T): HeaderData[];

  abstract getIcon(): string;
}
