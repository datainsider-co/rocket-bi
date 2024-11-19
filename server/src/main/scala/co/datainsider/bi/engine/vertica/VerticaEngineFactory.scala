package co.datainsider.bi.engine.vertica

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}

import java.util.Properties
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-12-13 9:52 PM
  *
  * @author tvc12 - Thien Vi
  */
class VerticaEngineFactory(
    poolSize: Int = 10,
    testConnTimeoutMs: Int = 30000,
    insertBatchSize: Int = 100000,
    defaultProperties: Map[String, String] = Map.empty
) extends EngineFactory[VerticaConnection] {
  override def create(connection: VerticaConnection): VerticaEngine = {
    try {
      val client = createClient(connection, poolSize)
      new VerticaEngine(
        client,
        connection = connection,
        testConnTimeoutMs = testConnTimeoutMs,
        insertBatchSize = insertBatchSize
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create VerticaEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: VerticaConnection): VerticaEngine = {
    try {
      val client = createClient(connection, 1)
      new VerticaEngine(
        client = client,
        connection = connection,
        testConnTimeoutMs = testConnTimeoutMs,
        insertBatchSize = insertBatchSize
      )
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create VerticaEngine cause ${ex.getMessage}", ex)
    }
  }

  private def createClient(connection: VerticaConnection, poolSize: Int): JdbcClient = {
    val properties = new Properties()
    properties.putAll(defaultProperties.asJava)
    properties.put("Label", s"jdbc-from-rocket-bi")
    properties.putAll(connection.properties.asJava)
    HikariClient(
      connection.jdbcUrl,
      connection.username,
      connection.password,
      maxPoolSize = Some(poolSize),
      properties = Some(properties)
    )
  }

}
