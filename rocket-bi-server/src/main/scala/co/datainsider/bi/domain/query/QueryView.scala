package co.datainsider.bi.domain.query

import co.datainsider.bi.util.StringUtils
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

/**
  * a view is a data table in which holds data to be selected and applied calculated functions (select, group by, sum, min, max...)
  * a view contains multiple fields and describes the source of data (from real data table, or from result of an sql...)
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[TableView], name = "table_view"),
    new Type(value = classOf[SqlView], name = "sql_view")
  )
)
abstract class QueryView {
  val aliasName: String
}

case class SqlView(aliasName: String, query: Query) extends QueryView

case class TableView(dbName: String, tblName: String, aliasViewName: Option[String] = None) extends QueryView {
  val fullName: String = s"$dbName.$tblName"

  override val aliasName: String = aliasViewName.getOrElse("tbl_" + StringUtils.shortMd5(fullName))
}
