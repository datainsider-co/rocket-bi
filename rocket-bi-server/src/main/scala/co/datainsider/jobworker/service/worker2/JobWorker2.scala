package co.datainsider.jobworker.service.worker2

import co.datainsider.jobworker.domain.response.SyncInfo
import com.twitter.util.Future

/**
  * Job Worker se handle viec theo flow
  * 1. Read data from data source and job config & Convert data to sequence of record
  * 2. Create table schema if not exists, can merge schema if existed
  * 3. Write data to destination using job config
  * 4. Clean up
  * 5. Report final status
  */
trait JobWorker2 {

  /**
    * Start job worker, khong throw exception
    */
  def run(syncInfo: SyncInfo, ensureRunning: () => Future[Unit], report: (JobWorkerProgress) => Future[Unit]): JobWorkerProgress
}
