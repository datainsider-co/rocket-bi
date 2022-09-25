import { JobInfo } from '@core/DataIngestion/Domain/Job/Job';
import { JobFormRender } from '@/screens/DataIngestion/FormBuilder/JobFormRender';
import { JdbcJob } from '@core/DataIngestion/Domain/Job/JdbcJob';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';
import { GoogleAnalyticsJobFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/JobFormRender/GoogleAnalyticsJobFormRender';
import { GoogleAnalyticJob } from '@core/DataIngestion/Domain/Job/GoogleAnalytic/GoogleAnalyticJob';
import { GoogleSheetJobFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/JobFormRender/GoogleSheetJobFormRender';
import { GoogleSheetJob } from '@core/DataIngestion/Domain/Job/GoogleSheetJob';
import { JobName } from '@core/DataIngestion/Domain/Job/JobName';
import { LakeJobFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/JobFormRender/LakeJobFormRender';
import { GA4JobFormRender } from '@/screens/DataIngestion/FormBuilder/RenderImpl/JobFormRender/GA4JobFormRender';
import { GA4Job } from '@core/DataIngestion/Domain/Job/GA4/GA4Job';

export class JobFormFactory {
  createRender(jobInfo: JobInfo): JobFormRender {
    switch (jobInfo.job.className) {
      case JobName.Jdbc:
        return new LakeJobFormRender(jobInfo.job as JdbcJob, jobInfo.source.sourceType);
      case JobName.GoogleSheetJob:
        return new GoogleSheetJobFormRender(jobInfo.job as GoogleSheetJob);
      case JobName.GoogleAnalyticJob:
        return new GoogleAnalyticsJobFormRender(jobInfo.job as GoogleAnalyticJob);
      case JobName.GA4Job:
        return new GA4JobFormRender(jobInfo.job as GA4Job);
      default:
        throw new UnsupportedException(`Unsupported job class name ${jobInfo.job.className}`);
    }
  }
}
