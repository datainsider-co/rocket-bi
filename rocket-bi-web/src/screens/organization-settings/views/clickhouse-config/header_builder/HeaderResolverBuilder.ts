import { DataSource, DataSourceType } from '@core/clickhouse-config';
import { DataSourceHeaderHandler } from '@/screens/organization-settings/views/clickhouse-config/header_builder/DataSourceHeaderHandler';
import { HeaderResolver } from '@/screens/organization-settings/views/clickhouse-config/header_builder/HeaderResolver';
import { Log } from '@core/utils';
import { ClassNotFound, DIException } from '@core/common/domain';

export class HeaderResolverBuilder {
  private readonly mapCreator: Map<DataSourceType, DataSourceHeaderHandler<DataSource>> = new Map();

  private defaultHandler: DataSourceHeaderHandler<DataSource> | null = null;

  add(type: DataSourceType, handler: DataSourceHeaderHandler<DataSource>): HeaderResolverBuilder {
    this.mapCreator.set(type, handler);
    return this;
  }

  addDefault(handler: DataSourceHeaderHandler<DataSource>): HeaderResolverBuilder {
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
