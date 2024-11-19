package co.datainsider.bi.engine.clickhouse

import co.datainsider.bi.client.HikariClient
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}

import java.util.Properties
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-12-13 5:26 PM
  *
  * @author tvc12 - Thien Vi
  */
class ClickhouseEngineFactory(
    poolSize: Int = 10,
    maxQueryRows: Int = 10000,
    testConnTimeoutMs: Int = 30000, // 30s
    defaultProperties: Map[String, String] = Map.empty
) extends EngineFactory[ClickhouseConnection] {
  override def create(connection: ClickhouseConnection): ClickhouseEngine = {
    try {
      val client = createClient(connection, poolSize)
      new ClickhouseEngine(
        client = client,
        connection = connection,
        maxQueryRows = maxQueryRows,
        testConnTimeoutMs = testConnTimeoutMs
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create ClickhouseEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: ClickhouseConnection): ClickhouseEngine = {
    try {
      val client = createClient(connection, 1)
      new ClickhouseEngine(
        client = client,
        connection = connection,
        maxQueryRows = maxQueryRows,
        testConnTimeoutMs = testConnTimeoutMs
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create ClickhouseEngine cause ${ex.getMessage}", ex)
    }
  }

  private def createClient(connection: ClickhouseConnection, poolSize: Int): HikariClient = {
    val properties = new Properties()
    properties.putAll(defaultProperties.asJava)
    properties.putAll(connection.properties.asJava)
    HikariClient(connection.toJdbcUrl, connection.username, connection.password, Some(poolSize), Some(properties))
  }

}
