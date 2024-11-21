import { Connector, ConnectorType } from '@core/connector-config';
import { HeaderData } from '@/shared/models';
import { DataSourceHeaderHandler } from '@/screens/organization-settings/views/connector-config/header_builder/DataSourceHeaderHandler';

export class HeaderResolver {
  private readonly mapCreator: Map<ConnectorType, DataSourceHeaderHandler<Connector>>;
  private readonly defaultCreator: DataSourceHeaderHandler<Connector>;

  constructor(mapCreator: Map<ConnectorType, DataSourceHeaderHandler<Connector>>, defaultCreator: DataSourceHeaderHandler<Connector>) {
    this.mapCreator = mapCreator;
    this.defaultCreator = defaultCreator;
  }

  buildHeader(source: Connector): HeaderData[] {
    return this.mapCreator.has(source.className) ? this.mapCreator.get(source.className)!.buildHeader(source) : this.defaultCreator.buildHeader(source);
  }

  getIcon(type: ConnectorType): string {
    return this.mapCreator.has(type) ? this.mapCreator.get(type)!.getIcon() : this.defaultCreator.getIcon();
  }
}
