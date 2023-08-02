package co.datainsider.datacook.pipeline.operator.persist

import co.datainsider.datacook.domain.persist.PersistentType.PersistentType
import co.datainsider.datacook.pipeline.operator.Operator
import com.fasterxml.jackson.annotation.JsonIgnore

import java.util.Properties

abstract class JdbcPersistOperator extends Operator {
  val tableName: String
  val databaseName: String
  val persistType: PersistentType

  val displayName: Option[String] = None

  @JsonIgnore
  def jdbcUrl: String

  @JsonIgnore
  def properties: Properties
}
