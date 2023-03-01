package datainsider.data_cook.domain.persist

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

/**
  * Cho phép lưu data tới các third party database
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[OracleJdbcPersistConfiguration], name = "oracle_jdbc_persist_configuration"),
    new Type(value = classOf[MySQLJdbcPersistConfiguration], name = "mysql_jdbc_persist_configuration"),
    new Type(value = classOf[MsSQLJdbcPersistConfiguration], name = "mssql_jdbc_persist_configuration"),
    new Type(value = classOf[PostgresJdbcPersistConfiguration], name = "postgres_jdbc_persist_configuration"),
    new Type(value = classOf[VerticaPersistConfiguration], name = "vertica_persist_configuration"),
  )
)
trait ThirdPartyPersistConfiguration extends ActionConfiguration {}
