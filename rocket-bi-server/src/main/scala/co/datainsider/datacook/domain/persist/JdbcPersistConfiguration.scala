package co.datainsider.datacook.domain.persist

import co.datainsider.datacook.domain.persist.PersistentType.PersistentType
import co.datainsider.datacook.pipeline.operator.Operator
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.persist._
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

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
) extends JdbcPersistConfiguration {
  override def toOperator(id: OperatorId): Operator = {
    OraclePersistOperator(
      id = id,
      host = host,
      port = port,
      serviceName = serviceName,
      username = username,
      password = password,
      databaseName = databaseName,
      tableName = tableName,
      persistType = persistType,
      sslConfiguration = sslConfiguration,
      sslServerCertDn = sslServerCertDn,
      retryCount = retryCount,
      retryDelay = retryDelay,
      extraPropertiesAsJson = extraPropertiesAsJson
    )
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
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration {
  override def toOperator(id: OperatorId): Operator = {
    MySQLPersistOperator(
      id = id,
      host = host,
      port = port,
      username = username,
      password = password,
      databaseName = databaseName,
      tableName = tableName,
      persistType = persistType,
      extraPropertiesAsJson = extraPropertiesAsJson
    )
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
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration {
  override def toOperator(id: OperatorId): Operator = {
    MsSQLPersistOperator(
      id = id,
      host = host,
      port = port,
      username = username,
      password = password,
      catalogName = catalogName,
      databaseName = databaseName,
      tableName = tableName,
      persistType = persistType,
      extraPropertiesAsJson = extraPropertiesAsJson
    )
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
    override val persistType: PersistentType,
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration {
  override def toOperator(id: OperatorId): Operator = {
    PostgresPersistOperator(
      id = id,
      host = host,
      port = port,
      username = username,
      password = password,
      catalogName = catalogName,
      databaseName = databaseName,
      tableName = tableName,
      persistType = persistType,
      extraPropertiesAsJson = extraPropertiesAsJson
    )
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
    extraPropertiesAsJson: Option[String] = None
) extends JdbcPersistConfiguration {
  override def toOperator(id: OperatorId): Operator = {
    VerticaPersistOperator(
      id = id,
      host = host,
      port = port,
      username = username,
      password = password,
      catalog = catalog,
      databaseName = databaseName,
      tableName = tableName,
      persistType = persistType,
      sslConfiguration = sslConfiguration,
      isLoadBalance = isLoadBalance,
      extraPropertiesAsJson = extraPropertiesAsJson
    )
  }
}
