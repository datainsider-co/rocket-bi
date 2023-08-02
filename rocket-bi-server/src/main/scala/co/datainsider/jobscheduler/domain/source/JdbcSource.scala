package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.DatabaseType.DatabaseType
import co.datainsider.jobscheduler.domain.DatabaseTypeRef
import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty

case class JdbcSource(
    orgId: Long,
    id: Long = 0,
    @NotEmpty displayName: String,
    @JsonScalaEnumeration(classOf[DatabaseTypeRef]) databaseType: DatabaseType,
    @NotEmpty jdbcUrl: String,
    @NotEmpty username: String,
    password: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Jdbc

  /** *
    *
    * @return config of this source to be pass to JobWorker, data is in form of key value pair, key values are hardcoded
    */
  override def getConfig: Map[String, Any] = {
    Map("database_type" -> databaseType.toString, "jdbc_url" -> jdbcUrl, "username" -> username, "password" -> password)
  }

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}
