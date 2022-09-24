package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.{QueryContext, RlsCondition}
import co.datainsider.bi.engine.TableExpressionUtils
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.twitter.inject.Logging
import datainsider.client.exception.BadRequestError

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[SqlQuery], name = "sql_query"),
    new Type(value = classOf[ObjectQuery], name = "object_query")
  )
)
trait Query {
  val encryptKey: Option[String]
  val rlsConditions: Seq[RlsCondition]
  val allQueryViews: Seq[QueryView]
  val externalContext: Option[QueryContext]

  def addConditions(conditions: Seq[Condition]): Query
  def setLimit(limit: Option[Limit]): Query
  def customCopy(rlsConditions: Seq[RlsCondition]): Query
  def customCopy(externalContext: Option[QueryContext]): Query

  def getFinalContext(): QueryContext

}

case class SqlQuery(
    query: String,
    encryptKey: Option[String] = None,
    rlsConditions: Seq[RlsCondition] = Seq.empty,
    externalContext: Option[QueryContext] = None
) extends Query
    with Logging {
  override val allQueryViews: Seq[QueryView] = {
    try {
      TableExpressionUtils.findFromClause(query).map(resp => TableView(resp._1, resp._2))
    } catch {
      case e: Throwable =>
        error(s"find dbName.tblName failed with exception: ${e}")
        Seq.empty
    }
  }

  override def addConditions(conditions: Seq[Condition]): Query = {
    throw BadRequestError(s"addFieldCondition($this) is not yet supported")
  }

  override def setLimit(limit: Option[Limit]): Query = {
    throw BadRequestError(s"addFieldCondition($this) is not yet supported")
  }

  override def customCopy(rlsConditions: Seq[RlsCondition]): SqlQuery = {
    this.copy(rlsConditions = rlsConditions)
  }

  override def customCopy(externalContext: Option[QueryContext]): SqlQuery = {
    this.copy(externalContext = externalContext)
  }

  override def getFinalContext(): QueryContext = {
    if (externalContext.isDefined) {
      externalContext.get
    } else QueryContext()
  }

}

case class ObjectQuery(
    functions: Seq[Function],
    conditions: Seq[Condition] = Seq.empty, // conditions are linked each other by "and"
    aggregateConditions: Seq[AggregateCondition] = Seq.empty,
    joinConditions: Seq[JoinCondition] = Seq.empty,
    orders: Seq[OrderBy] = Seq.empty,
    queryViews: Seq[QueryView] = Seq.empty,
    limit: Option[Limit] = None,
    encryptKey: Option[String] = None,
    rlsConditions: Seq[RlsCondition] = Seq.empty,
    externalContext: Option[QueryContext] = None
) extends Query {
  override def addConditions(conditions: Seq[Condition]): Query = {
    this.copy(conditions = this.conditions ++ conditions)
  }

  override def setLimit(limit: Option[Limit]): Query = {
    this.copy(limit = limit)
  }

  val allQueryViews: Seq[QueryView] = {
    (getTblViewsFromFunctions(functions) ++ getTblViewsFromConditions(conditions) ++ queryViews).distinct
  }

  private def getTblViewsFromFunctions(functions: Seq[Function]): Seq[TableView] = {
    val tableViews = ArrayBuffer.empty[TableView]

    functions.foreach {
      case f: FieldRelatedFunction => tableViews ++= getTableViewFromField(f.field)
      case _                       =>
    }

    tableViews.distinct
  }

  private def getTblViewsFromConditions(conditions: Seq[Condition]): Seq[TableView] = {
    val tableViews = ArrayBuffer.empty[TableView]

    conditions.foreach {
      case condition: FieldRelatedCondition => tableViews ++= getTableViewFromField(condition.field)
      case and: And                         => tableViews ++= getTblViewsFromConditions(and.conditions)
      case or: Or                           => tableViews ++= getTblViewsFromConditions(or.conditions)
      case eq: EqualField =>
        tableViews ++= getTableViewFromField(eq.leftField)
        tableViews ++= getTableViewFromField(eq.rightField)
      case neq: NotEqualField =>
        tableViews ++= getTableViewFromField(neq.leftField)
        tableViews ++= getTableViewFromField(neq.rightField)
      case _ =>
    }

    tableViews.distinct
  }

  private def getTableViewFromField(field: Field): Option[TableView] = {
    field match {
      case tblField: TableField       => Some(TableView(tblField.dbName, tblField.tblName))
      case exprField: ExpressionField => Some(TableView(exprField.dbName, exprField.tblName))
      case calcField: CalculatedField => Some(TableView(calcField.dbName, calcField.tblName))
      case _                          => None
    }
  }

  override def customCopy(rlsConditions: Seq[RlsCondition]): ObjectQuery = {
    this.copy(rlsConditions = rlsConditions)
  }

  override def customCopy(externalContext: Option[QueryContext]): ObjectQuery = {
    this.copy(externalContext = externalContext)
  }

  def getFinalContext: QueryContext = {
    val functionsFields: Seq[Field] = functions
      .filter(_.isInstanceOf[FieldRelatedFunction])
      .map(_.asInstanceOf[FieldRelatedFunction])
      .map(_.field)

    val conditionsFields: Seq[Field] = getFieldsFromConditions(conditions)

    val innerExpressions: Map[String, String] = getExpressionsFromFields((functionsFields ++ conditionsFields).distinct)
    val outerExpressions: Map[String, String] =
      if (externalContext.isDefined) externalContext.get.variables else Map.empty

    QueryContext(innerExpressions ++ outerExpressions)
  }

  private def getExpressionsFromFields(fields: Seq[Field]): Map[String, String] = {
    val expressionFields = fields
      .filter(_.isInstanceOf[ExpressionField])
      .map(_.asInstanceOf[ExpressionField])
      .map(exprField => (exprField.fieldName, exprField.expression))
      .toMap

    val calculatedFields = fields
      .filter(_.isInstanceOf[CalculatedField])
      .map(_.asInstanceOf[CalculatedField])
      .map(calcField => (calcField.fieldName, calcField.expression))
      .toMap

    expressionFields ++ calculatedFields
  }

  private def getFieldsFromConditions(conditions: Seq[Condition]): Seq[Field] = {
    val fields = ArrayBuffer.empty[Field]

    conditions.foreach {
      case condition: FieldRelatedCondition => fields += condition.field
      case and: And                         => fields ++= getFieldsFromConditions(and.conditions)
      case or: Or                           => fields ++= getFieldsFromConditions(or.conditions)
      case eq: EqualField =>
        fields += eq.leftField
        fields += eq.rightField
      case neq: NotEqualField =>
        fields += neq.leftField
        fields += neq.rightField
      case _ =>
    }

    fields.distinct
  }
}
