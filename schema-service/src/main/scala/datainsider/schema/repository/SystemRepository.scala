package datainsider.schema.repository

import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.schema.domain.{ClickhouseSource, SystemInfo}
import education.x.commons.KVS

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2022-07-19 6:03 PM
  *
  * @author tvc12 - Thien Vi
  */
trait SystemRepository {

  def getSystemInfo(orgId: Long): Future[SystemInfo]

  def setSystemInfo(orgId: Long, source: SystemInfo): Future[Boolean]
}

class SystemRepositoryImpl(clickhouseSource: ClickhouseSource, systemInfoDatabase: KVS[String, SystemInfo])
    extends SystemRepository {
  override def getSystemInfo(orgId: Long): Future[SystemInfo] = {
    val key: String = buildKey(orgId)
    for {
      systemInfo <- systemInfoDatabase.get(key).asTwitter
    } yield {
      val currentSystemInfo = systemInfo match {
        case Some(systemInfo) => systemInfo
        case _                => SystemInfo.default(orgId)
      }
      currentSystemInfo.copy(sources = Seq(clickhouseSource))
    }
  }

  override def setSystemInfo(orgId: Long, source: SystemInfo): Future[Boolean] = {
    val key: String = buildKey(orgId)
    systemInfoDatabase.add(key, source.copy(updatedTime = System.currentTimeMillis())).asTwitter
  }

  private def buildKey(orgId: Long): String = s"system.source"
}
