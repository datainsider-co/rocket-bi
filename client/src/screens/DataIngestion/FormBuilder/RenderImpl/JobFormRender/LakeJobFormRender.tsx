import { JobFormRender } from '@/screens/DataIngestion/FormBuilder/JobFormRender';
import { Job, SyncMode } from '@core/DataIngestion/Domain/Job/Job';
import { BFormInput } from 'bootstrap-vue';
import '@/screens/DataIngestion/components/DataSourceConfigForm/scss/lake_job_form.scss';
import { JdbcJob } from '@core/DataIngestion/Domain/Job/JdbcJob';
import SchedulerSettingV2 from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerSettingV2.vue';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { Log } from '@core/utils';
import { DataSourceType } from '@core/DataIngestion';

export class LakeJobFormRender implements JobFormRender {
  private jdbcJob: JdbcJob;
  private dataSourceType: DataSourceType;

  constructor(jdbcJob: JdbcJob, dataSourceType: DataSourceType) {
    this.jdbcJob = jdbcJob;
    this.dataSourceType = dataSourceType;
  }

  createJob(): Job {
    switch (this.syncMode) {
      case SyncMode.FullSync: {
        this.jdbcJob.resetIncrementalColumn();
        this.jdbcJob.resetLastSyncedValue();
        break;
      }
    }
    return this.jdbcJob;
  }

  private get displayName() {
    return this.jdbcJob.displayName;
  }

  private set displayName(value: string) {
    this.jdbcJob.displayName = value;
  }

  private get syncMode(): SyncMode {
    return this.jdbcJob.syncMode;
  }

  private get timeScheduler(): TimeScheduler {
    Log.debug('getSchedulerTime::', this.jdbcJob.scheduleTime);
    return this.jdbcJob.scheduleTime;
  }

  private set timeScheduler(value: TimeScheduler) {
    this.jdbcJob.scheduleTime = value;
  }

  render(h: any): any {
    return (
      <div class="jdbc-job-section">
        <div class="job-config-item">
          <div class="title">Job name:</div>
          <div class="input">
            <BFormInput placeholder="Input job name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>
        {this.timeScheduler && (
          <SchedulerSettingV2
            class="lake-scheduler-form"
            schedulerTime={this.timeScheduler}
            onChange={(schedulerTime: TimeScheduler) => {
              Log.debug('ChangeScheduler::', schedulerTime);
              this.timeScheduler = schedulerTime;
            }}></SchedulerSettingV2>
        )}
      </div>
    );
  }
}
