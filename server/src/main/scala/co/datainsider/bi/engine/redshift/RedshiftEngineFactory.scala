package co.datainsider.bi.engine.redshift

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}

import java.util.Properties
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-12-13 9:52 PM
  *
  * @author tvc12 - Thien Vi
  */
class RedshiftEngineFactory(
    poolSize: Int = 10,
    testConnTimeoutMs: Int = 30000,
    defaultProperties: Map[String, String] = Map.empty
) extends EngineFactory[RedshiftConnection] {
  override def create(connection: RedshiftConnection): RedshiftEngine = {
    try {
      val client = createClient(connection, poolSize)
      new RedshiftEngine(client, connection, testConnTimeoutMs = testConnTimeoutMs)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create RedshiftEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: RedshiftConnection): RedshiftEngine = {
    try {
      val client = createClient(connection, 1)
      new RedshiftEngine(client, connection, testConnTimeoutMs = testConnTimeoutMs)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create RedshiftEngine cause ${ex.getMessage}", ex)
    }
  }

  private def createClient(connection: RedshiftConnection, poolSize: Int): JdbcClient = {
    val properties = new Properties()
    properties.putAll(defaultProperties.asJava)
    properties.putAll(connection.properties.asJava)
    val driverClassName = Some("com.amazon.redshift.jdbc42.Driver")
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
