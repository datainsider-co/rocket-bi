import { JobFormRender } from '@/screens/DataIngestion/FormBuilder/JobFormRender';
import { Job, SyncMode } from '@core/DataIngestion/Domain/Job/Job';
import { BFormInput, BFormRadio, BFormRadioGroup } from 'bootstrap-vue';
import '@/screens/DataIngestion/components/DataSourceConfigForm/scss/job_form.scss';
import { JdbcJob } from '@core/DataIngestion/Domain/Job/JdbcJob';
import { DatabaseSuggestionCommand } from '@/screens/DataIngestion/interfaces/DatabaseSuggestionCommand';
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import { TableSuggestionCommand } from '@/screens/DataIngestion/interfaces/TableSuggestionCommand';
import { IncrementalColumnSuggestionCommand } from '@/screens/DataIngestion/interfaces/IncrementalColumnSuggestionCommand';
import DestDatabaseSuggestion from '@/screens/DataIngestion/FormBuilder/RenderImpl/DestDatabaseSuggestion/DestDatabaseSuggestion.vue';
import SchedulerSettingV2 from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerSettingV2.vue';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { Log } from '@core/utils';
import { DataSourceType } from '@core/DataIngestion';
import { StringUtils } from '@/utils/string.utils';

export class JdbcJobFormRender implements JobFormRender {
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

  private get formTitle() {
    switch (this.dataSourceType) {
      case DataSourceType.MSSql:
      case DataSourceType.PostgreSql:
      case DataSourceType.Redshift:
        return 'Schema name';
      default:
        return 'Database name';
    }
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

  private set syncMode(syncMode: SyncMode) {
    this.jdbcJob.syncMode = syncMode;
  }

  private get databaseName(): string {
    return this.jdbcJob.databaseName;
  }

  private set databaseName(value: string) {
    this.jdbcJob.databaseName = value;
  }

  private get tableName(): string {
    return this.jdbcJob.tableName;
  }

  private set tableName(value: string) {
    this.jdbcJob.tableName = value;
  }

  private get destDatabaseName(): string {
    return this.jdbcJob.destDatabaseName;
  }

  private set destDatabaseName(value: string) {
    this.jdbcJob.destDatabaseName = value;
  }

  private get destTableName(): string {
    return this.jdbcJob.destTableName;
  }

  private set destTableName(value: string) {
    this.jdbcJob.destTableName = value;
  }

  private get incrementalColumn(): string | undefined {
    return this.jdbcJob.incrementalColumn;
  }

  private set incrementalColumn(value: string | undefined) {
    this.jdbcJob.incrementalColumn = value;
  }

  private get startValue(): string | undefined {
    return this.jdbcJob.lastSyncedValue;
  }

  private set startValue(value: string | undefined) {
    this.jdbcJob.lastSyncedValue = value;
  }

  private get syncIntervalInMn(): number {
    return this.jdbcJob.syncIntervalInMn;
  }

  private set syncIntervalInMn(value: number) {
    this.jdbcJob.syncIntervalInMn = value;
  }

  private get timeScheduler(): TimeScheduler {
    Log.debug('getSchedulerTime::', this.jdbcJob.scheduleTime);
    return this.jdbcJob.scheduleTime;
  }

  private set timeScheduler(value: TimeScheduler) {
    this.jdbcJob.scheduleTime = value;
  }

  private get syncModeClass() {
    if (this.jdbcJob.syncMode === SyncMode.IncrementalSync) {
      return 'box incremental-sync-box';
    }
    return 'box';
  }

  render(h: any): any {
    return (
      <div class="jdbc-job-section">
        <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Job name:</div>
          <div class="input">
            <BFormInput placeholder="Input job name" autocomplete="off" v-model={this.displayName}></BFormInput>
          </div>
        </div>
        <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">{this.formTitle}:</div>
          <div class="input">
            <DynamicSuggestionInput
              {...{
                props: {
                  suggestionCommand: new DatabaseSuggestionCommand(this.jdbcJob.sourceId),
                  value: this.databaseName,
                  placeholder: 'Input database name'
                }
              }}
              onChange={(value: string) => {
                this.databaseName = value;
              }}
            />
          </div>
        </div>
        <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Table name:</div>
          <div class="input">
            <DynamicSuggestionInput
              {...{
                props: {
                  suggestionCommand: new TableSuggestionCommand(this.jdbcJob.sourceId, this.databaseName),
                  value: this.tableName,
                  placeholder: 'Input table name'
                }
              }}
              onChange={(value: string) => {
                this.tableName = value;
              }}
            />
          </div>
        </div>
        <DestDatabaseSuggestion
          id="di-dest-database-selection"
          databaseLabel="Destination Database"
          tableLabel="Destination Table"
          databaseName={this.destDatabaseName}
          tableName={this.destTableName}
          onChangeDatabase={(newName: string) => {
            this.destDatabaseName = StringUtils.toSnakeCase(newName);
          }}
          onChangeTable={(newName: string) => {
            this.destTableName = StringUtils.toSnakeCase(newName);
          }}
        />
        <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
          <div class="title">Sync mode:</div>
          <div class="input align-content-center">
            <BFormRadioGroup plain id="radio-group-2" v-model={this.syncMode} name="radio-sub-component">
              <BFormRadio value={SyncMode.FullSync}>Full sync</BFormRadio>
              <BFormRadio value={SyncMode.IncrementalSync}>Incremental sync</BFormRadio>
            </BFormRadioGroup>
          </div>
        </div>
        <div class={this.syncModeClass}>
          {this.syncMode === SyncMode.IncrementalSync && (
            <div class="job-form-item d-flex flex-column">
              <div class="job-form-item d-flex w-100 justify-content-center align-items-center">
                <div class="title">Incremental column:</div>
                <div class="input">
                  <DynamicSuggestionInput
                    {...{
                      props: {
                        suggestionCommand: new IncrementalColumnSuggestionCommand(this.jdbcJob.sourceId, this.databaseName, this.tableName),
                        value: this.incrementalColumn,
                        placeholder: 'Input incremental column'
                      }
                    }}
                    onChange={(value: string) => {
                      this.incrementalColumn = value;
                    }}
                  />
                </div>
              </div>
              <div class="job-form-item mb-2 d-flex w-100 justify-content-center align-items-center">
                <div class="title">Start value:</div>
                <div class="input">
                  <BFormInput placeholder="Input start value" autocomplete="off" v-model={this.startValue}></BFormInput>
                </div>
              </div>
            </div>
          )}
        </div>
        {!this.timeScheduler && (
          <div class="job-form-item mb-2 d-flex w-100 justify-content-center align-items-center">
            <div class="title">Sync interval(minutes):</div>
            <div class="input">
              <BFormInput placeholder="Input sync interval in minutes" autocomplete="off" v-model={this.syncIntervalInMn}></BFormInput>
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
            }}></SchedulerSettingV2>
        )}
      </div>
    );
  }
}
