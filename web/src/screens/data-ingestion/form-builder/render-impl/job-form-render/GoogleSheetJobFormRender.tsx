import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { Job } from '@core/data-ingestion/domain/job/Job';
import { BFormInput } from 'bootstrap-vue';
import '@/screens/data-ingestion/components/data-source-config-form/scss/JobForm.scss';
import { GoogleSheetJob } from '@core/data-ingestion/domain/job/GoogleSheetJob';

import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import SchedulerSettingV2 from '@/screens/data-ingestion/components/job-scheduler-form/SchedulerSettingV2.vue';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';

export class GoogleSheetJobFormRender implements JobFormRender {
  private googleCredentialJob: GoogleSheetJob;

  constructor(googleCredentialJob: GoogleSheetJob) {
    this.googleCredentialJob = googleCredentialJob;
  }

  createJob(): Job {
    return this.googleCredentialJob;
  }

  private get displayName() {
    return this.googleCredentialJob.displayName;
  }

  private set displayName(value: string) {
    this.googleCredentialJob.displayName = value;
  }

  private get destDatabaseName(): string {
    return this.googleCredentialJob.destDatabaseName;
  }

  private set destDatabaseName(value: string) {
    this.googleCredentialJob.destDatabaseName = value;
  }

  private get destTableName(): string {
    return this.googleCredentialJob.destTableName;
  }

  private set destTableName(value: string) {
    this.googleCredentialJob.destTableName = value;
  }

  private get syncIntervalInMn(): number {
    return this.googleCredentialJob.syncIntervalInMn;
  }

  private set syncIntervalInMn(value: number) {
    this.googleCredentialJob.syncIntervalInMn = value;
  }

  private get timeScheduler(): TimeScheduler {
    Log.debug('getSchedulerTime::', this.googleCredentialJob.scheduleTime);
    return this.googleCredentialJob.scheduleTime;
  }

  private set timeScheduler(value: TimeScheduler) {
    this.googleCredentialJob.scheduleTime = value;
  }

  render(h: any): any {
    return (
      <div class="jdbc-job-section">
        <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title" style={{ width: '120px' }}>
            Job name:
          </div>
          <div class="input">
            <BFormInput placeholder="Input job name" autocomplete="off" v-model={this.displayName} />
          </div>
        </div>
        <DestDatabaseSuggestion
          id="di-dest-database-selection"
          class="mb-12px"
          databaseLabel="Dest Database"
          tableLabel="Dest Table"
          labelWidth={120}
          databaseName={this.destDatabaseName}
          tableName={this.destTableName}
          onChangeDatabase={(newName: string) => {
            this.destDatabaseName = StringUtils.toSnakeCase(newName);
          }}
          onChangeTable={(newName: string) => {
            this.destTableName = StringUtils.toSnakeCase(newName);
          }}
        />

        {!this.timeScheduler && (
          <div class="job-form-item d-flex flex-column">
            <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
              <div class="title">Sync interval(minutes):</div>
              <div class="input">
                <BFormInput placeholder="Input sync interval in minutes" autocomplete="off" v-model={this.syncIntervalInMn} />
              </div>
            </div>
          </div>
        )}
        {this.timeScheduler && (
          <SchedulerSettingV2
            class="job-scheduler-form-jdbc"
            schedulerTime={this.timeScheduler}
            onChange={(schedulerTime: TimeScheduler) => {
              Log.debug('ChangeScheduler::', schedulerTime);
              this.timeScheduler = schedulerTime;
            }}
          />
        )}
      </div>
    );
  }
}
