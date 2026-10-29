import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { DatabaseService, HttpDatabaseService } from './DatabaseService';
import { DatabaseShareService, HttpDatabaseShareService } from './DatabaseShareService';
import { HttpTableService, TableService } from './TableService';

/** Services of the Data Warehouse pages. */
export const WarehouseModule: DiModule = di => {
  di.bindSingleton(DatabaseService, d => new HttpDatabaseService(d.get(ApiClient)));
  di.bindSingleton(TableService, d => new HttpTableService(d.get(ApiClient)));
  di.bindSingleton(DatabaseShareService, d => new HttpDatabaseShareService(d.get(ApiClient)));
};
