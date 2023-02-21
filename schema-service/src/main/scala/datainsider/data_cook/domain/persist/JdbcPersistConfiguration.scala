package datainsider.data_cook.domain.persist

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.persist.PersistentType.PersistentType

@deprecated("use JDBCPersistOperator instead")
abstract class JdbcPersistConfiguration() extends ThirdPartyPersistConfiguration {
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
    retryDelay: Int = 2,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration

case class MySQLJdbcPersistConfiguration(
    host: String,
    port: Int,
    username: String,
    password: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef])
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration

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
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration

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
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration
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
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration
