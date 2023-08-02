import { DataSource, DataSourceType } from '@core/clickhouse-config';
import { HeaderData } from '@/shared/models';
import { DataSourceHeaderHandler } from '@/screens/organization-settings/views/clickhouse-config/header_builder/DataSourceHeaderHandler';

export class HeaderResolver {
  private readonly mapCreator: Map<DataSourceType, DataSourceHeaderHandler<DataSource>>;
  private readonly defaultCreator: DataSourceHeaderHandler<DataSource>;

  constructor(mapCreator: Map<DataSourceType, DataSourceHeaderHandler<DataSource>>, defaultCreator: DataSourceHeaderHandler<DataSource>) {
    this.mapCreator = mapCreator;
    this.defaultCreator = defaultCreator;
  }

  buildHeader(source: DataSource): HeaderData[] {
    return this.mapCreator.has(source.className) ? this.mapCreator.get(source.className)!.buildHeader(source) : this.defaultCreator.buildHeader(source);
  }

  getIcon(type: DataSourceType): string {
    return this.mapCreator.has(type) ? this.mapCreator.get(type)!.getIcon() : this.defaultCreator.getIcon();
  }
}
