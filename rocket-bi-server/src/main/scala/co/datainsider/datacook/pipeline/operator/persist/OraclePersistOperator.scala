package co.datainsider.datacook.pipeline.operator.persist
import co.datainsider.datacook.domain.persist.PersistentType.PersistentType
import co.datainsider.datacook.domain.persist.{PersistentTypeRef, SSLConfiguration}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.{JsonParser, ZConfig}
import oracle.jdbc.OracleConnection

import java.util.Properties

case class OraclePersistOperator(
    id: OperatorId,
    host: String,
    port: Int,
    serviceName: String,
    username: String,
    password: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    persistType: PersistentType,
    sslConfiguration: Option[SSLConfiguration] = None,
    sslServerCertDn: String = "",
    retryCount: Int = 5,
    retryDelay: Int = 2,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistOperator {

  override def jdbcUrl: String = {
    if (sslConfiguration.isDefined) {
      val protocol: String = sslConfiguration.get.getProtocol()
      s"""jdbc:oracle:thin:@(DESCRIPTION=(retry_count=$retryCount)(retry_delay=$retryDelay)(address=(protocol=$protocol)(port=$port)(host=$host))(connect_data=(service_name=$serviceName)))"""
    } else {
      s"jdbc:oracle:thin:@//${host}:${port}/${serviceName}"
    }
  }

  // related to https://docs.oracle.com/cd/B28359_01/java.111/b31224/urls.htm#i1006162
  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties.setProperty("loginTimeout", ZConfig.getLong("data_cook.connection_timeout_in_second", 30).toString)
    // issue with timezone: https://stackoverflow.com/questions/9156379/ora-01882-timezone-region-not-found
    properties.setProperty("oracle.jdbc.timezoneAsRegion", "false")
    val extraProperties: Properties = JsonParser.fromJson[Properties](extraPropertiesAsJson.getOrElse("{}"))
    properties.putAll(extraProperties)
    if (sslConfiguration.isDefined) {
      val sslProperties = sslConfiguration.get.getProperties()
      properties.putAll(sslProperties)
      properties.setProperty(OracleConnection.CONNECTION_PROPERTY_THIN_SSL_SERVER_DN_MATCH, "true")
      properties.setProperty(OracleConnection.CONNECTION_PROPERTY_THIN_SSL_SERVER_CERT_DN, sslServerCertDn)
    }
    properties
  }
}
