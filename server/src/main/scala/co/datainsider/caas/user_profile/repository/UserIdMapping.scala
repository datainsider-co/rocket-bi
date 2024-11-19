package co.datainsider.caas.user_profile.repository

import co.datainsider.bi.util.Implicits._
import co.datainsider.caas.user_profile.domain.Implicits.OptionString
import com.twitter.util.Future
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.ExecutionContext.Implicits.global

trait UserIdMapping {

  def add(orgId: Long, id: String, username: String): Future[Boolean]

  def getUserName(orgId: Long, id: String): Future[Option[String]]

  def isExists(orgId: Long, id: String): Future[Boolean]

  def delete(orgId: Long, id: String): Future[Boolean]

}

case class EmailUserMappingImpl(client: SSDB, emailKey: String) extends UserIdMapping {
  private val emailKVS = new SsdbKVS[String, String](emailKey, client)

  override def add(orgId: Long, email: String, username: String): Future[Boolean] = {
    emailKVS.add(getKey(orgId, email), username).asTwitterFuture
  }

  override def getUserName(orgId: Long, email: String): Future[Option[String]] = {
    emailKVS.get(getKey(orgId, email)).map(_.notEmptyOrNull).asTwitterFuture
  }

  override def isExists(orgId: Long, email: String): Future[Boolean] = {
    emailKVS.get(getKey(orgId, email)).map(_.isDefined).asTwitterFuture
  }

  override def delete(orgId: Long, email: String): Future[Boolean] = {
    emailKVS.remove(getKey(orgId, email)).asTwitterFuture
  }

  private def getKey(orgId: Long, email: String) = s"${orgId}_$email"
}

case class PhoneUserMappingImpl(client: SSDB, phoneKey: String) extends UserIdMapping {
  private val phoneKVS = new SsdbKVS[String, String](phoneKey, client)
  override def add(orgId: Long, phone: String, username: String): Future[Boolean] = {
    phoneKVS.add(getKey(orgId, phone), username).asTwitterFuture
  }

  override def getUserName(orgId: Long, phone: String): Future[Option[String]] = {
    phoneKVS.get(getKey(orgId, phone)).asTwitterFuture
  }

  override def isExists(orgId: Long, phone: String): Future[Boolean] = {
    phoneKVS.get(getKey(orgId, phone)).map(_.isDefined).asTwitterFuture
  }

  override def delete(orgId: Long, phone: String): Future[Boolean] = {
    phoneKVS.remove(getKey(orgId, phone)).asTwitterFuture
  }

  private def getKey(orgId: Long, phone: String) = s"${orgId}_$phone"
}
