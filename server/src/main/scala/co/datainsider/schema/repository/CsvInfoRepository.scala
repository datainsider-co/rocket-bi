package co.datainsider.schema.repository

import co.datainsider.schema.domain.CsvUploadInfo
import com.google.inject.Inject
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.RichScalaFuture
import education.x.commons.SsdbKVS

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

trait CsvInfoRepository {

  def get(csvId: String): Future[Option[CsvUploadInfo]]

  def put(csvInfo: CsvUploadInfo): Future[Boolean]
}

class CsvInfoRepositoryImpl @Inject()(db: SsdbKVS[String, CsvUploadInfo]) extends CsvInfoRepository {

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global

  override def get(csvId: String): Future[Option[CsvUploadInfo]] = {
    db.get(csvId).asTwitterFuture
  }

  override def put(csvInfo: CsvUploadInfo): Future[Boolean] = {
    db.add(csvInfo.id, csvInfo).asTwitterFuture
  }
}
