import { Connector, ConnectorType } from '@core/connector-config';
import { DataSourceHeaderHandler } from '@/screens/organization-settings/views/connector-config/header_builder/DataSourceHeaderHandler';
import { HeaderResolver } from '@/screens/organization-settings/views/connector-config/header_builder/HeaderResolver';
import { Log } from '@core/utils';
import { ClassNotFound, DIException } from '@core/common/domain';

export class HeaderResolverBuilder {
  private readonly mapCreator: Map<ConnectorType, DataSourceHeaderHandler<Connector>> = new Map();

  private defaultHandler: DataSourceHeaderHandler<Connector> | null = null;

  add(type: ConnectorType, handler: DataSourceHeaderHandler<Connector>): HeaderResolverBuilder {
    this.mapCreator.set(type, handler);
    return this;
  }

  addDefault(handler: DataSourceHeaderHandler<Connector>): HeaderResolverBuilder {
    this.defaultHandler = handler;
    return this;
  }

  build(): HeaderResolver {
    if (!this.defaultHandler) {
      Log.error('HeaderResolverBuilder::build::defaultHandler is required!');
      throw new ClassNotFound('');
    }
    return new HeaderResolver(this.mapCreator, this.defaultHandler);
  }
}
