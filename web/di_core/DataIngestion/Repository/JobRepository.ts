/*
 * @author: tvc12 - Thien Vi
 * @created: 6/1/21, 2:03 PM
 */

import { Job, JobInfo } from '@core/DataIngestion/Domain/Job/Job';
import { BaseClient } from '@core/services/base.service';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { JobId } from '@core/domain';
import { DataSourceType, JobType, ListingResponse } from '@core/DataIngestion';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';
import { ForceMode } from '@core/LakeHouse/Domain/LakeJob/ForceMode';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { JobName } from '@core/DataIngestion/Domain/Job/JobName';

const headerScheduler = {
  'Content-Type': 'application/json',
  'access-token': 'job$cheduler@datainsider.co'
};

export abstract class JobRepository {
  abstract create(request: Job): Promise<JobInfo>;

  abstract multiCreate(request: Job, tables: string[]): Promise<boolean>;

  abstract list(request: ListingRequest): Promise<ListingResponse<JobInfo>>;

  abstract delete(id: JobId): Promise<boolean>;

  abstract update(id: JobId, job: Job): Promise<boolean>;

  abstract testConnection(job: Job): Promise<BaseResponse>;

  abstract forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<BaseResponse>;

  abstract cancel(jobId: JobId): Promise<BaseResponse>;
}

export class JobRepositoryImpl extends JobRepository {
  @InjectValue(DIKeys.authClient)
  private readonly httpClient!: BaseClient;
  private readonly apiPath = 'scheduler/job';

  create(request: Job): Promise<JobInfo> {
    return this.httpClient.post(`${this.apiPath}/create`, { job: request }, void 0, headerScheduler).then(jobInfo => JobInfo.fromObject(jobInfo));
  }

  list(request: ListingRequest): Promise<ListingResponse<JobInfo>> {
    return this.httpClient
      .post<any>(`${this.apiPath}/list`, request, void 0, headerScheduler)
      .then(response => new ListingResponse<JobInfo>(this.parseToListJob(response.data), response.total));
  }

  delete(jobId: JobId): Promise<boolean> {
    return this.httpClient.delete<boolean>(`${this.apiPath}/${jobId}`, void 0, void 0, headerScheduler);
  }

  update(id: JobId, job: Job): Promise<boolean> {
    return this.httpClient.put<boolean>(`${this.apiPath}/${id}`, { job: job }, void 0, headerScheduler);
  }

  testConnection(job: Job): Promise<BaseResponse> {
    return this.httpClient.post(`worker/job/test`, job, void 0, headerScheduler);
  }

  private parseToListJob(listObjects: any[]): JobInfo[] {
    return listObjects.map(obj => JobInfo.fromObject(obj));
  }

  forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<BaseResponse> {
    return this.httpClient.put(`scheduler/schedule/job/${jobId}/now`, { atTime: date, mode: mode }, void 0, headerScheduler);
  }

  cancel(jobId: JobId): Promise<BaseResponse> {
    return this.httpClient.put(`scheduler/schedule/job/${jobId}/kill`, {}, void 0, headerScheduler);
  }

  multiCreate(request: Job, tables: string[]): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/multi_create`, { baseJob: request, tableNames: tables }, void 0, headerScheduler);
  }
}

export class JobRepositoryMock extends JobRepository {
  cancel(jobId: JobId): Promise<BaseResponse> {
    return Promise.resolve({ success: false });
  }

  create(request: Job): Promise<JobInfo> {
    return Promise.resolve(
      JobInfo.fromObject({
        job: {
          className: 'jdbc_job',
          currentSyncStatus: 'Error',
          databaseName: 'information_schema',
          destDatabaseName: 'aaaaa',
          destTableName: 'sale',
          destinations: ['Hadoop', 'Clickhouse'],
          displayName: 'Test Job',
          incrementalColumn: null,
          jobId: 31,
          jobType: 'Jdbc',
          lastSuccessfulSync: 1643356899224,
          lastSyncStatus: 'Error',
          lastSyncedValue: '0',
          maxFetchSize: 0,
          nextRunTime: 19999999999998,
          orgId: 0,
          queryStatement: null,
          scheduleTime: { className: 'schedule_once', startTime: 1642954889000 },
          sourceId: 2,
          syncIntervalInMn: 60,
          syncMode: 'FullSync',
          tableName: 'COLUMNS'
        },
        source: {
          className: 'jdbc_source',
          databaseType: 'MySql',
          displayName: 'Di-Datainsider',
          id: 2,
          jdbcUrl: 'jdbc:mysql://di-mysql:3306',
          orgId: 0,
          password: '',
          username: ''
        }
      })
    );
  }

  delete(id: JobId): Promise<boolean> {
    return Promise.resolve(false);
  }

  forceSync(jobId: JobId, date: number, mode: ForceMode): Promise<BaseResponse> {
    return Promise.resolve({ success: false });
  }

  list(request: ListingRequest): Promise<ListingResponse<JobInfo>> {
    return Promise.resolve(
      new ListingResponse(
        [
          JobInfo.fromObject({
            job: {
              className: 'jdbc_job',
              currentSyncStatus: 'Error',
              databaseName: 'information_schema',
              destDatabaseName: 'aaaaa',
              destTableName: 'sale',
              destinations: ['Hadoop', 'Clickhouse'],
              displayName: 'Test Job',
              incrementalColumn: null,
              jobId: 31,
              jobType: 'Jdbc',
              lastSuccessfulSync: 1643356899224,
              lastSyncStatus: 'Error',
              lastSyncedValue: '0',
              maxFetchSize: 0,
              nextRunTime: 19999999999998,
              orgId: 0,
              queryStatement: null,
              scheduleTime: { className: 'schedule_once', startTime: 1642954889000 },
              sourceId: 2,
              syncIntervalInMn: 60,
              syncMode: 'FullSync',
              tableName: 'COLUMNS'
            },
            source: {
              className: 'jdbc_source',
              databaseType: 'MySql',
              displayName: 'Di-Datainsider',
              id: 2,
              jdbcUrl: 'jdbc:mysql://di-mysql:3306',
              orgId: 0,
              password: '',
              username: ''
            }
          }),
          JobInfo.fromObject({
            job: {
              className: JobName.Jdbc,
              currentSyncStatus: 'Error',
              databaseName: 'information_schema',
              destDatabaseName: 'aaaaa',
              destTableName: 'sale',
              destinations: ['Hadoop', 'Clickhouse'],
              displayName: 'Test Job',
              incrementalColumn: null,
              jobId: 31,
              jobType: JobType.GenericJdbc,
              lastSuccessfulSync: 1643356899224,
              lastSyncStatus: 'Error',
              lastSyncedValue: '0',
              maxFetchSize: 0,
              nextRunTime: 19999999999998,
              orgId: 0,
              queryStatement: null,
              scheduleTime: { className: 'schedule_once', startTime: 1642954889000 },
              sourceId: 2,
              syncIntervalInMn: 60,
              syncMode: 'FullSync',
              tableName: 'COLUMNS'
            },
            source: {
              className: 'jdbc_source',
              databaseType: DataSourceType.Others,
              displayName: 'Di-Datainsider',
              id: 2,
              jdbcUrl: 'jdbc:mysql://di-mysql:3306',
              orgId: 0,
              password: '',
              username: ''
            }
          }),
          JobInfo.fromObject({
            job: {
              className: 'xfdfdf',
              currentSyncStatus: 'Error',
              databaseName: 'information_schema',
              destDatabaseName: 'aaaaa',
              destTableName: 'sale',
              destinations: ['Hadoop', 'Clickhouse'],
              displayName: 'Test Job',
              incrementalColumn: null,
              jobId: 31,
              jobType: 'dfdfdf',
              lastSuccessfulSync: 1643356899224,
              lastSyncStatus: 'Error',
              lastSyncedValue: '0',
              maxFetchSize: 0,
              nextRunTime: 19999999999998,
              orgId: 0,
              queryStatement: null,
              scheduleTime: { className: 'schedule_once', startTime: 1642954889000 },
              sourceId: 2,
              syncIntervalInMn: 60,
              syncMode: 'FullSync',
              tableName: 'COLUMNS'
            },
            source: {
              className: 'xxx',
              databaseType: 'MySql',
              displayName: 'Di-Datainsider',
              id: 2,
              jdbcUrl: 'jdbc:mysql://di-mysql:3306',
              orgId: 0,
              password: '',
              username: ''
            }
          })
        ],
        0
      )
    );
  }

  testConnection(job: Job): Promise<BaseResponse> {
    return Promise.resolve({ success: false });
  }

  update(id: JobId, job: Job): Promise<boolean> {
    return Promise.resolve(false);
  }

  multiCreate(request: Job, tables: string[]): Promise<boolean> {
    return Promise.resolve(false);
  }
}
