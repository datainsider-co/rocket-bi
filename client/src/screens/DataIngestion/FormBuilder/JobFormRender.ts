import { Job } from '@core/DataIngestion/Domain/Job/Job';
import { DataSourceType, JdbcJob } from '@core/DataIngestion';
import { JdbcJobFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/JobFormRender/JdbcJobFormRender';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';

export abstract class JobFormRender {
  abstract createJob(): Job;
  abstract render(h: any): any;

  static default(): JobFormRender {
    const jdbcJob = JdbcJob.fromObject({ scheduleTime: new SchedulerOnce(Date.now()) });
    return new JdbcJobFormRender(jdbcJob, DataSourceType.MySql);
  }
}
