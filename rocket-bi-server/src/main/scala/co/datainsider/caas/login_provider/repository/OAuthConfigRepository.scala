package co.datainsider.caas.login_provider.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.caas.login_provider.domain.OAuthConfig
import co.datainsider.caas.user_profile.util.JsonParser

import java.sql.ResultSet
import javax.inject.{Inject, Named}
import scala.collection.mutable

object OAuthConfigRepository {
  val QUERY_INSERT_OR_UPDATE_OAUTH =
    "replace into caas.`login_method_provider` (oauth_type, organization_id, oauth_config) VALUES (?, ?, ?)"
  val QUERY_ALL_OAUTH_METHOD_PROVIDER =
    "select oauth_type, oauth_config from caas.`login_method_provider` where `organization_id`=?"
  val QUERY_DELETE_OAUTH =
    "DELETE FROM caas.`login_method_provider` WHERE organization_id = ? AND oauth_type = ?"
}

trait OAuthConfigRepository {
  def insertOrUpdateIfExisted(oauthType: String, config: OAuthConfig): Boolean

  def multiInsertOrUpdateIfExisted(oauthConfigAsMap: Map[String, OAuthConfig]): Boolean

  def getAllOAuthConfig(organizationId: Long): Map[String, OAuthConfig]

  def deleteOathConfig(organizationId: Long, oauthType: String): Boolean
}

case class OAuthConfigRepositoryImpl @Inject() (@Named("mysql") client: JdbcClient) extends OAuthConfigRepository {

  import OAuthConfigRepository._

  override def insertOrUpdateIfExisted(oauthType: String, config: OAuthConfig): Boolean = {
    client.executeUpdate(QUERY_INSERT_OR_UPDATE_OAUTH, oauthType, config.organizationId, JsonParser.toJson(config)) > 0
  }

  override def getAllOAuthConfig(organizationId: Long): Map[String, OAuthConfig] = {
    client.executeQuery[Map[String, OAuthConfig]](QUERY_ALL_OAUTH_METHOD_PROVIDER, organizationId)(readOAuthConfigAsMap)
  }

  private def readOAuthConfigAsMap(rs: ResultSet): Map[String, OAuthConfig] = {
    val oauthConfigAsMap = mutable.HashMap.empty[String, OAuthConfig]
    while (rs.next()) {
      val oauthType = rs.getString("oauth_type")
      val oauthConfigAsString = rs.getString("oauth_config")
      if (oauthType != null && oauthConfigAsString != null) {
        oauthConfigAsMap.put(oauthType, JsonParser.fromJson[OAuthConfig](oauthConfigAsString))
      }
    }
    oauthConfigAsMap.toMap
  }

  override def multiInsertOrUpdateIfExisted(oauthConfigAsMap: Map[String, OAuthConfig]): Boolean = {
    val data = oauthConfigAsMap.values
      .map(oauthConfig => Array(oauthConfig.oauthType, oauthConfig.organizationId, JsonParser.toJson(oauthConfig)))
      .toArray
    client.executeBatchUpdate(QUERY_INSERT_OR_UPDATE_OAUTH, data) > 0
  }

  override def deleteOathConfig(organizationId: Long, oauthType: String): Boolean = {
    client.executeUpdate(QUERY_DELETE_OAUTH, organizationId, oauthType) > 0
  }
}
