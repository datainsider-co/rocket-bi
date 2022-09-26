package datainsider.data_cook.domain.persist

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.persist.PersistentType.PersistentType
import oracle.jdbc.OracleConnection

import java.util.Properties

abstract class JdbcPersistConfiguration() extends ThirdPartyPersistConfiguration {
  @JsonIgnore
  def jdbcUrl: String

  @JsonIgnore
  def properties: Properties

  def tableName: String
  def databaseName: String
  def persistType: PersistentType
  val displayName: Option[String] = None

  override def validate(): Unit = Unit
}

case class OracleJdbcPersistConfiguration(
    host: String,
    port: Int,
    serviceName: String,
    username: String,
    password: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    override val persistType: PersistentType,
    sslConfiguration: Option[SSLConfiguration] = None,
    sslServerCertDn: String = "",
    retryCount: Int = 5,
    retryDelay: Int = 2
) extends JdbcPersistConfiguration {

  def jdbcUrl: String = {
    if (sslConfiguration.isDefined) {
      val protocol: String = sslConfiguration.get.getProtocol()
      s"""jdbc:oracle:thin:@(DESCRIPTION=(retry_count=$retryCount)(retry_delay=$retryDelay)(address=(protocol=$protocol)(port=$port)(host=$host))(connect_data=(service_name=$serviceName)))"""
    } else {
      s"jdbc:oracle:thin:@//${host}:${port}/${serviceName}"
    }
  }

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    if (sslConfiguration.isDefined) {
      val sslProperties = sslConfiguration.get.getProperties()
      properties.putAll(sslProperties)
      properties.setProperty(OracleConnection.CONNECTION_PROPERTY_THIN_SSL_SERVER_DN_MATCH, "true")
      properties.setProperty(OracleConnection.CONNECTION_PROPERTY_THIN_SSL_SERVER_CERT_DN, sslServerCertDn)
    }
    properties
  }
}

case class MySQLJdbcPersistConfiguration(
    host: String,
    port: Int,
    username: String,
    password: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    override val persistType: PersistentType
) extends JdbcPersistConfiguration {
  def jdbcUrl: String = s"jdbc:mysql://${host}:${port}/?useUnicode=yes&characterEncoding=UTF-8&serverTimezone=UTC"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties
  }
}

case class MsSQLJdbcPersistConfiguration(
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
    override val persistType: PersistentType
) extends JdbcPersistConfiguration {
  def jdbcUrl: String =
    s"jdbc:sqlserver://${host}:${port};databaseName=${catalogName};useUnicode=yes;characterEncoding=UTF-8;serverTimezone=UTC"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties
  }
}

case class PostgresJdbcPersistConfiguration(
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
    override val persistType: PersistentType
) extends JdbcPersistConfiguration {
  def jdbcUrl: String =
    s"jdbc:postgresql://${host}:${port}/${catalogName}?useUnicode=yes&characterEncoding=UTF-8&serverTimezone=UTC"

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties
  }
}
case class VerticaPersistConfiguration(
    host: String,
    port: Int,
    username: String,
    password: String,
    catalog: String = "",
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    override val persistType: PersistentType,
    sslConfiguration: Option[SSLConfiguration] = None,
    isLoadBalance: Boolean = false,
) extends JdbcPersistConfiguration {
  def jdbcUrl: String = ???

  override def properties: Properties = ???
}
