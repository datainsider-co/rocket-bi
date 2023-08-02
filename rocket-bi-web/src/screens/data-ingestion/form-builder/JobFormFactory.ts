import { JobInfo } from '@core/data-ingestion/domain/job/Job';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { JdbcJob } from '@core/data-ingestion/domain/job/JdbcJob';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { GoogleAnalyticsJobFormRender } from '@/screens/data-ingestion/form-builder/render-impl/job-form-render/GoogleAnalyticsJobFormRender';
import { GoogleAnalyticJob } from '@core/data-ingestion/domain/job/google-analytic/GoogleAnalyticJob';
import { GoogleSheetJobFormRender } from '@/screens/data-ingestion/form-builder/render-impl/job-form-render/GoogleSheetJobFormRender';
import { GoogleSheetJob } from '@core/data-ingestion/domain/job/GoogleSheetJob';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { LakeJobFormRender } from '@/screens/data-ingestion/form-builder/render-impl/job-form-render/LakeJobFormRender';
import { GA4Job } from '@core/data-ingestion/domain/job/ga4/GA4Job';
import { GA4JobFormRender } from '@/screens/data-ingestion/form-builder/render-impl/job-form-render/GA4JobFormRender';

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
