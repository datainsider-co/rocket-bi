package co.datainsider.bi.engine.posgresql

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}

import java.util.Properties
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-12-13 9:52 PM
  *
  * @author tvc12 - Thien Vi
  */
class PostgreSqlEngineFactory(
    poolSize: Int = 10,
    testConnTimeoutMs: Int = 30000,
    defaultProperties: Map[String, String] = Map.empty
) extends EngineFactory[PostgreSqlConnection] {
  override def create(connection: PostgreSqlConnection): PostgreSqlEngine = {
    try {
      val client = createClient(connection, poolSize)
      new PostgreSqlEngine(client, connection, testConnTimeoutMs)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create PostgreSqlEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: PostgreSqlConnection): PostgreSqlEngine = {
    try {
      val client = createClient(connection, 1)
      new PostgreSqlEngine(client, connection, testConnTimeoutMs)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create PostgreSqlEngine cause ${ex.getMessage}", ex)
    }
  }

  private def createClient(connection: PostgreSqlConnection, poolSize: Int): JdbcClient = {
    val properties = new Properties()
    properties.putAll(defaultProperties.asJava)
    properties.putAll(connection.properties.asJava)
    val driverClassName = Some("org.postgresql.Driver")
    HikariClient(
      connection.jdbcUrl,
      connection.username,
      connection.password,
      maxPoolSize = Some(poolSize),
      properties = Some(properties),
      driverClassName = driverClassName
    )
  }

}
