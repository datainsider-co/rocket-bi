package datainsider.data_cook.pipeline.operator.persist

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.{JsonParser, ZConfig}
import datainsider.data_cook.domain.persist.PersistentType.PersistentType
import datainsider.data_cook.domain.persist.{PersistentTypeRef, SSLConfiguration}
import datainsider.data_cook.pipeline.operator.Operator
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import oracle.jdbc.OracleConnection

import java.util.Properties

abstract class JDBCPersistOperator extends Operator {
  val tableName: String
  val databaseName: String
  val persistType: PersistentType

  val displayName: Option[String] = None

  @JsonIgnore
  def jdbcUrl: String

  @JsonIgnore
  def properties: Properties
}

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
) extends JDBCPersistOperator {

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

case class MySQLPersistOperator(
    id: OperatorId,
    host: String,
    port: Int,
    username: String,
    password: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JDBCPersistOperator {
  def jdbcUrl: String = s"jdbc:mysql://${host}:${port}/"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties.setProperty("useUnicode", "yes")
    properties.setProperty("characterEncoding", "UTF-8")
    properties.setProperty("serverTimezone", "UTC")
    val extraProperties: Properties = JsonParser.fromJson[Properties](extraPropertiesAsJson.getOrElse("{}"))
    properties.putAll(extraProperties)
    properties
  }
}

case class MsSQLPersistOperator(
    id: OperatorId,
    host: String,
    port: Int,
    username: String,
    password: String,
    // database name
    catalogName: String,
    // table schema name
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JDBCPersistOperator {
  override def jdbcUrl: String = s"jdbc:sqlserver://${host}:${port};databaseName=${catalogName}"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties.setProperty("useUnicode", "yes")
    properties.setProperty("characterEncoding", "UTF-8")
    properties.setProperty("serverTimezone", "UTC")
    val extraProperties: Properties = JsonParser.fromJson[Properties](extraPropertiesAsJson.getOrElse("{}"))
    properties.putAll(extraProperties)
    properties
  }
}

case class PostgresPersistOperator(
    id: OperatorId,
    host: String,
    port: Int,
    username: String,
    password: String,
    // mapping with database
    catalogName: String,
    // mapping with schema name
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JDBCPersistOperator {
  def jdbcUrl: String = s"jdbc:postgresql://${host}:${port}/${catalogName}"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties.setProperty("useUnicode", "yes")
    properties.setProperty("characterEncoding", "UTF-8")
    properties.setProperty("serverTimezone", "UTC")
    val extraProperties: Properties = JsonParser.fromJson[Properties](extraPropertiesAsJson.getOrElse("{}"))
    properties.putAll(extraProperties)
    properties
  }
}
