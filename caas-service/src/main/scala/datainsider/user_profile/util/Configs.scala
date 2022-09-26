package datainsider.user_profile.util

import datainsider.client.util.ZConfig

import scala.collection.JavaConverters._

/**
  * @author sonpn
  */
object Configs {

  val orgEmails: Map[String, String] = ZConfig.getConfig("caas.org_email", null) match {
    case null => Map.empty[String, String]
    case x => {
      var map = Map.empty[String, String]
      val iterator = x.entrySet().iterator()
      while (iterator.hasNext) {
        val item = iterator.next()
        val key = item.getKey
        map += (key -> x.getString(key))
      }
      map
    }
  }

  val verifyPhone: Map[String, Boolean] = ZConfig.getConfig("caas.verify_phone", null) match {
    case null => Map.empty[String, Boolean]
    case x => {
      var map = Map.empty[String, Boolean]
      val iterator = x.entrySet().iterator()
      while (iterator.hasNext) {
        val item = iterator.next()
        val key = item.getKey
        map += (key -> x.getBoolean(key))
      }
      map
    }
  }

  val mapAllowUpdateProfile: Map[String, Boolean] = ZConfig.getConfig("caas.allow_auto_update_profile", null) match {
    case null => Map.empty[String, Boolean]
    case x    => x.entrySet().iterator().asScala.toSeq.map(f => f.getKey -> x.getBoolean(f.getKey)).toMap
  }

  def enableAutoUpdateProfile(oauthType: String) = mapAllowUpdateProfile.getOrElse(oauthType, true)

  def isNeedVerifyPhone(oauthType: String): Boolean = verifyPhone.getOrElse(oauthType, false)

  def isOrgEmail(oauthType: String, email: Option[String]): Boolean = {
    orgEmails.get(oauthType) match {
      case Some(x) =>
        email match {
          case Some(y) => Utils.isValidEmail(y, x)
          case _       => false
        }
      case _ => false
    }
  }

  /**
   * enhance permission with org id
   */
  def enhancePermissions(orgId: Long, permissions: String*): Seq[String] = {
    permissions.map(permission => s"$orgId:$permission")
  }
}
