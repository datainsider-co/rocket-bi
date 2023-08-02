package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.query.{ObjectQuery, Query, TableField}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.operator.{
  DestTableConfig,
  ExpressionFieldConfiguration,
  FieldConfiguration,
  NormalFieldConfiguration
}
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.schema.domain.TableSchema
import datainsider.client.util.Implicits.FutureEnhance

import scala.collection.mutable

case class ManageFieldOperator(
    id: OperatorId,
    fields: Array[NormalFieldConfiguration],
    destTableConfiguration: DestTableConfig,
    extraFields: Array[ExpressionFieldConfiguration] = Array.empty
) extends TableResultOperator

case class ManageFieldOperatorExecutor(operatorService: OperatorService) extends Executor[ManageFieldOperator] {

  @throws[OperatorException]
  @throws[InputInvalid]
  override def execute(operator: ManageFieldOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      try {
        val parentTable: TableSchema = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
        val sourceFieldList: Seq[NormalFieldConfiguration] = makeNormalFieldConfigs(parentTable)
        val allFieldList: Seq[FieldConfiguration] =
          (mergeFields(sourceFieldList, operator.fields.toSeq) ++ operator.extraFields).filterNot(_.isHidden)
        val aliasDisplayNames: Array[String] = allFieldList.map(_.displayName).toArray
        val tableSchema: TableSchema = operatorService
          .createViewTable(
            context.orgId,
            context.jobId,
            toQuery(allFieldList),
            operator.destTableConfiguration,
            aliasDisplayNames = aliasDisplayNames
          )
          .syncGet()
        TableResult(operator.id, tableSchema)
      } catch {
        case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
      }

    }

  private def makeNormalFieldConfigs(parentTable: TableSchema): Seq[NormalFieldConfiguration] = {
    parentTable.columns
      .map(column => {
        val displayName =
          if (column.displayName == null || column.displayName.isEmpty) column.name else column.displayName
        NormalFieldConfiguration(
          displayName = displayName,
          field = TableField(
            dbName = parentTable.dbName,
            tblName = parentTable.name,
            fieldName = column.name,
            fieldType = ""
          ),
          isHidden = false
        )
      })
  }

  /**
    * merge with logic:
    * 1. if field in source list & target list, then use target field
    * 2. if field in source list & not in target list, then use source field
    * 3. if field not in source list & in target list, remove it
    */
  private def mergeFields(
      sourceConfigList: Seq[NormalFieldConfiguration],
      targetConfigList: Seq[NormalFieldConfiguration]
  ): Seq[NormalFieldConfiguration] = {
    val sourceMap =
      mutable.Map[String, NormalFieldConfiguration](sourceConfigList.map(field => field.field.fieldName -> field): _*)
    targetConfigList.foreach(targetConfig => {
      if (sourceMap.contains(targetConfig.field.fieldName)) {
        sourceMap.put(targetConfig.field.fieldName, targetConfig)
      }
    })
    sourceMap.values.toSeq
  }

  private def toQuery(fieldConfigurations: Seq[FieldConfiguration]): Query = {
    ObjectQuery(
      functions = fieldConfigurations.map(_.toSelectFunction)
    )
  }

  private def ensureInput(
      operator: ManageFieldOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for manage field operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing previous result of manage field operator")
    }
  }

}
