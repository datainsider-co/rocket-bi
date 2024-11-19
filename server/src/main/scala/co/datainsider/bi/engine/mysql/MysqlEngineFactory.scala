package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}

import java.util.Properties
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-12-13 9:52 PM
  *
  * @author tvc12 - Thien Vi
  */
class MysqlEngineFactory(
    poolSize: Int = 10,
    testConnTimeoutMs: Int = 30000,
    insertBatchSize: Int = 100000,
    defaultProperties: Map[String, String] = Map.empty
) extends EngineFactory[MysqlConnection] {
  override def create(connection: MysqlConnection): MySqlEngine = {
    try {
      val client = createClient(connection, poolSize)
      new MySqlEngine(
        client = client,
        connection = connection,
        testConnTimeoutMs = testConnTimeoutMs,
        insertBatchSize = insertBatchSize
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create MySqlEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: MysqlConnection): MySqlEngine = {
    try {
      val client = createClient(connection, 1)
      new MySqlEngine(
        client = client,
        connection = connection,
        testConnTimeoutMs = testConnTimeoutMs,
        insertBatchSize = insertBatchSize
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create MySqlEngine cause ${ex.getMessage}", ex)
    }
  }

  private def createClient(connection: MysqlConnection, poolSize: Int): JdbcClient = {
    val properties = new Properties()
    properties.putAll(defaultProperties.asJava)
    properties.putAll(connection.properties.asJava)
    HikariClient(connection.jdbcUrl, connection.username, connection.password, Some(poolSize), Some(properties))
  }

}
