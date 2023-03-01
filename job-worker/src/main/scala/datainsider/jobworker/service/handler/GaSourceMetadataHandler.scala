package datainsider.jobworker.service.handler

import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.GaJob
import datainsider.jobworker.service.worker.GaWorker

class GaSourceMetadataHandler(connTimeoutMs: Int = 30000, readTimeoutMs: Int = 30000) extends SourceMetadataHandler {

  override def testConnection(): Future[Boolean] = ???

  override def listDatabases(): Future[Seq[String]] = ???

  override def listTables(databaseName: String): Future[Seq[String]] = ???

  override def testJob(job: Job): Future[Boolean] =
    Future {
      try {
        val worker = GaWorker(null, null,connTimeoutMs, readTimeoutMs)
        worker.testConnection(job.asInstanceOf[GaJob])
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to query data: $e", e)
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = ???
}
