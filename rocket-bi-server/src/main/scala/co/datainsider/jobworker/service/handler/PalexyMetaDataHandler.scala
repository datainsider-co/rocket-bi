package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.client.palexy.{PalexyClient, PalexyResponse}
import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.source.PalexySource
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import java.sql.Date

class PalexyMetaDataHandler(
    client: PalexyClient,
    source: PalexySource
) extends SourceMetadataHandler
    with Logging {

  override def testConnection(): Future[Boolean] = {
    Future {
      val SAMPLE_DATE = Date.valueOf("2012-12-12")
      val response: PalexyResponse = client
        .getStoreReport(
          apiKey = source.apiKey,
          metrics = Set("visits"),
          dimensions = Set("day"),
          fromDate = SAMPLE_DATE,
          toDate = SAMPLE_DATE
        )
      true
    }
  }

  override def listDatabases(): Future[Seq[String]] = Future.Nil

  override def listTables(databaseName: String): Future[Seq[String]] = Future.Nil

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future.Nil

  override def testJob(job: Job): Future[Boolean] = Future.True
}
