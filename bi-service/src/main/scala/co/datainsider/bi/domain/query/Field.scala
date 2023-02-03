package co.datainsider.bi.domain.query

import co.datainsider.bi.util.StringUtils
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

/**
  * define how a field in sql
  * a sql field is part of sql in which determines which column is selected and how a specific condition is applied on
  * E.g: select fieldA, fieldB from some_table where fieldA = 'Hello' and fieldB < 10
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[TableField], name = "table_field"),
    new Type(value = classOf[ViewField], name = "view_field"),
    new Type(value = classOf[ExpressionField], name = "expression_field"),
    new Type(value = classOf[CalculatedField], name = "calculated_field")
  )
)
abstract class Field {
  val fieldName: String
  val fieldType: String

  val aliasViewName: String

  def fullFieldName: String = s"$aliasViewName.`$fieldName`"

  def normalizedFieldName: String = s"${aliasViewName.replace('.', '_')}_$fieldName"

}

/**
  * field from a specific table (real table)
  * @param dbName name of db
  * @param tblName name of table
  * @param fieldName name of field
  * @param fieldType data type of field
  */
case class TableField(
    dbName: String,
    tblName: String,
    fieldName: String,
    fieldType: String,
    tblAliasName: Option[String] = None
) extends Field {

  val aliasViewName: String = tblAliasName.getOrElse("tbl_" + StringUtils.shortMd5(s"$dbName.$tblName"))

  def toTableView(): TableView = TableView(dbName, tblName)

}

/**
  * field from a sql result table
  * @param viewName name of the view
  * @param fieldName field name
  * @param fieldType field type
  */
case class ViewField(viewName: String, fieldName: String, fieldType: String) extends Field {

  override val aliasViewName: String = viewName

}

case class ExpressionField(
    expression: String,
    dbName: String,
    tblName: String,
    fieldName: String,
    fieldType: String,
    tblAliasName: Option[String] = None
) extends Field {

  override val fullFieldName: String = fieldName

  val aliasViewName: String = tblAliasName.getOrElse("tbl_" + StringUtils.shortMd5(s"$dbName.$tblName"))

}

case class CalculatedField(
    expression: String,
    dbName: String,
    tblName: String,
    fieldName: String,
    fieldType: String,
    expressionType: String = "",
    tblAliasName: Option[String] = None
) extends Field {

  override val fullFieldName: String = fieldName

  val aliasViewName: String = tblAliasName.getOrElse("tbl_" + StringUtils.shortMd5(s"$dbName.$tblName"))

}
