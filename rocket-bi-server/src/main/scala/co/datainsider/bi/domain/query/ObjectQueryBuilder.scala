package co.datainsider.bi.domain.query

import scala.collection.mutable.ArrayBuffer

class ObjectQueryBuilder {
  val functions: ArrayBuffer[Function] = ArrayBuffer.empty
  val conditions: ArrayBuffer[Condition] = ArrayBuffer.empty
  val aggregateConditions: ArrayBuffer[AggregateCondition] = ArrayBuffer.empty
  val orders: ArrayBuffer[OrderBy] = ArrayBuffer.empty
  val joinConditions: ArrayBuffer[JoinCondition] = ArrayBuffer.empty
  val queryViews: ArrayBuffer[QueryView] = ArrayBuffer.empty
  val limit: Option[Limit] = None

  def addFunction(func: Function): Unit = functions += func

  def addFunctions(funcs: Array[Function]): Unit = functions ++= funcs

  def addCondition(cond: Condition): Unit = conditions += cond

  def addConditions(conds: Array[Condition]): Unit = conditions ++= conds

  def addOrder(newOrder: OrderBy): Unit = orders += newOrder

  def addOrders(newOrders: Array[OrderBy]): Unit = orders ++= newOrders

  def addViews(view: Array[SqlView]): Unit = queryViews ++= view

  def addTableView(view: TableView): Unit = queryViews += view

  def addJoinConditions(joinCondition: Array[JoinCondition]): Unit = joinConditions ++= joinCondition

  def addAggregateConditions(aggregateCondition: Array[AggregateCondition]): Unit =
    aggregateConditions ++= aggregateCondition

  def build(): ObjectQuery = {
    ObjectQuery(
      queryViews = queryViews,
      functions = functions,
      conditions = conditions,
      aggregateConditions = aggregateConditions,
      joinConditions = joinConditions,
      orders = orders,
      limit = limit
    )
  }

}
