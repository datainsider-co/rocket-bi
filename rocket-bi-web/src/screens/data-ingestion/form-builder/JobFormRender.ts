import { Job } from '@core/data-ingestion/domain/job/Job';
import { DataSourceType, JdbcJob } from '@core/data-ingestion';
import { JdbcJobFormRender } from '@/screens/data-ingestion/form-builder/render-impl/job-form-render/JdbcJobFormRender';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';

export abstract class JobFormRender {
  abstract createJob(): Job;
  abstract render(h: any): any;

  static default(): JobFormRender {
    const jdbcJob = JdbcJob.fromObject({ scheduleTime: new SchedulerOnce(Date.now()) });
    return new JdbcJobFormRender(jdbcJob, DataSourceType.MySql);
  }
}
