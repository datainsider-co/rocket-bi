import type { DiModule } from '@/core/di/Container';
import { ApiClient, SchedulerClient } from '@/core/http/tokens';
import { CsvImportService, HttpCsvImportService } from './CsvImportService';
import { DataSourceService, HttpDataSourceService } from './DataSourceService';
import { HttpJobHistoryService, JobHistoryService } from './JobHistoryService';
import { HttpJobService, JobService } from './JobService';

export const IngestionModule: DiModule = di => {
  di.bindSingleton(DataSourceService, d => new HttpDataSourceService(d.get(SchedulerClient)));
  di.bindSingleton(JobService, d => new HttpJobService(d.get(SchedulerClient)));
  di.bindSingleton(JobHistoryService, d => new HttpJobHistoryService(d.get(SchedulerClient)));
  di.bindSingleton(CsvImportService, d => new HttpCsvImportService(d.get(ApiClient)));
};
