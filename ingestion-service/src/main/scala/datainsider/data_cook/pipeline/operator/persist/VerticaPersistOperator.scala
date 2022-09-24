package datainsider.data_cook.pipeline.operator.persist

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.persist.PersistentType.PersistentType
import datainsider.data_cook.domain.persist.{PersistentTypeRef, SSLConfiguration}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId

import java.time.Duration
import java.util.Properties

/**
  * created 2022-08-25 10:36 AM
  * @author tvc12 - Thien Vi
  */
case class VerticaPersistOperator(
    id: OperatorId,
    host: String,
    port: Int,
    username: String,
    password: String,
    // schema of vertica
    catalog: String,
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef]) persistType: PersistentType,
    sslConfiguration: Option[SSLConfiguration] = None,
    isLoadBalance: Boolean = false
) extends JDBCPersistOperator {

  override def jdbcUrl: String = s"jdbc:vertica://${host}:${port}/${catalog}"

  private def setupSSL(properties: Properties) = {
    if (sslConfiguration.isDefined) {
      val sslProperties = sslConfiguration.get.getProperties()
      properties.putAll(sslProperties)
    }
  }

  override def properties: Properties = {
    val properties = new Properties()
    properties.setProperty("user", username)
    properties.setProperty("password", password)
    properties.put("ConnectionLoadBalance", isLoadBalance.asInstanceOf[Object])
    val timeoutSec: Int = ZConfig.getInt("data_cook.connection_timeout_in_second", 30)
    properties.put("LoginTimeout", timeoutSec.asInstanceOf[Object])
    properties.put("Label", s"jbdc-from-datainsider-etl-$id")
    setupSSL(properties)
    properties
  }
}
