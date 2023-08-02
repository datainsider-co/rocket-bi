package co.datainsider.jobworker.domain.source

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.DatabaseType.DatabaseType
import co.datainsider.jobworker.domain.{DataSource, DataSourceType, DatabaseTypeRef}
import co.datainsider.jobworker.domain.Ids.SourceId

case class JdbcSource(
                       orgId: Long = -1,
                       id: SourceId,
                       displayName: String,
                       @JsonScalaEnumeration(classOf[DatabaseTypeRef]) databaseType: DatabaseType,
                       jdbcUrl: String,
                       username: String,
                       password: String
                     ) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Jdbc

  override def getConfig: Map[String, Any] = {
    Map("database_type" -> databaseType.toString, "jdbc_url" -> jdbcUrl, "username" -> username, "password" -> password)
  }

}
