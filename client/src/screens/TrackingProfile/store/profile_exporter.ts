import { AbstractTableQuerySetting } from '@core/domain/Model';
import { FilterRequest, TrackingProfileSearchRequest } from '@core/domain/Request';
import { DIWorkers } from '@/workers';
import * as Comlink from 'comlink';
import { CsvData } from '@core/domain/Response/Page';
import { CsvDataQueryResponseConverter } from '@core/misc/query_response_converter';
import { DI } from '@core/modules';
import { CsvExporter } from '@core/misc/csv_exporter';
import { TrackingProfileService } from '@core/tracking/service';

const TESTING_DEFAULT_MAX_EXPORT = 1000000;

export class ProfileCsvExporter extends CsvExporter {
  constructor(
    protected query: AbstractTableQuerySetting,
    protected filterRequests: FilterRequest[],
    progressCb?: (completedPercent: number, completed: number, total: number) => void
  ) {
    super(progressCb);
  }

  async run(): Promise<boolean> {
    return await DIWorkers.downloadCsvData(
      {
        name: `user_profile_${new Date(Date.now()).toLocaleString()}`,
        maxSizeInBytes: process.env.VUE_APP_EXPORT_MAX_FILE_SIZE as any,
        request: new TrackingProfileSearchRequest(this.query, this.filterRequests),
        from: 0,
        batchSize: 500
      },
      Comlink.proxy(this.getProfileData),
      Comlink.proxy(this.onFileCompleted),
      Comlink.proxy(this.onProgress)
    );
  }

  async getProfileData(request: TrackingProfileSearchRequest, from: number, size: number): Promise<CsvData> {
    const trackingProfileSearchRequest = new TrackingProfileSearchRequest(request.querySetting, request.filterRequests, from, size);
    const response = await DI.get(TrackingProfileService).search(trackingProfileSearchRequest);
    return new CsvDataQueryResponseConverter().convert(response);
  }
}

export class MockProfileCsvExporter extends ProfileCsvExporter {
  async getProfileData(request: any, from: number, size: number): Promise<CsvData> {
    if (from >= TESTING_DEFAULT_MAX_EXPORT) {
      return new CsvData([], TESTING_DEFAULT_MAX_EXPORT, []);
    }
    const trackingProfileSearchRequest = new TrackingProfileSearchRequest(request.query, request.filterRequests, 0, size);
    const response = await DI.get(TrackingProfileService).search(trackingProfileSearchRequest);
    const data = new CsvDataQueryResponseConverter().convert(response);

    const records = [
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records,
      ...data.records
    ];

    return new CsvData(data.headers, TESTING_DEFAULT_MAX_EXPORT, records);
  }
}
