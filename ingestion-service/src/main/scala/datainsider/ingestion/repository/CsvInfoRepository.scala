package datainsider.ingestion.repository

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.ingestion.domain.CsvUploadInfo
import education.x.commons.SsdbKVS

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

trait CsvInfoRepository {

  def get(csvId: String): Future[Option[CsvUploadInfo]]

  def put(csvInfo: CsvUploadInfo): Future[Boolean]
}

class SsdbCsvRepository @Inject() (db: SsdbKVS[String, CsvUploadInfo]) extends CsvInfoRepository {

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global

  override def get(csvId: String): Future[Option[CsvUploadInfo]] = {
    db.get(csvId).asTwitter
  }

  override def put(csvInfo: CsvUploadInfo): Future[Boolean] = {
    db.add(csvInfo.id, csvInfo).asTwitter
  }
}
