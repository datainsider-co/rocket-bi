package co.datainsider.bi.service

import co.datainsider.bi.domain.CompareMode.{CompareMode, PercentageDiff, RawValues, ValuesDiff}
import co.datainsider.bi.domain.Ids.Geocode
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart._
import co.datainsider.bi.domain.query._
import co.datainsider.bi.domain.request._
import co.datainsider.bi.domain.response._
import co.datainsider.bi.engine.clickhouse.{ClickhouseParser, DataTable}
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.Implicits.ImplicitObject
import co.datainsider.bi.util.StringUtils.{findClosestString, normalizeVietnamese}
import co.datainsider.bi.util._
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.domain.user.UserProfile
import co.datainsider.schema.client.SchemaClientService
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.{ArrayNode, ObjectNode}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.{FutureEnhance, async}
import co.datainsider.common.client.exception.BadRequestError
import co.datainsider.common.client.util.JsonParser.mapper

import scala.collection.immutable.HashMap
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

trait QueryService {
  def query(request: ChartRequest): Future[ChartResponse]

  def query(request: SqlQueryRequest): Future[SqlQueryResponse]

  def query(request: QueryViewAsRequest): Future[ChartResponse]

  def exportToFile(request: ChartRequest, fileType: FileType): Future[String]

}

class QueryServiceImpl @Inject() (
    queryExecutor: QueryExecutor,
    geolocationService: GeolocationService,
    relationshipService: RelationshipService,
    rlsPolicyService: RlsPolicyService,
    schemaClientService: SchemaClientService
) extends QueryService
    with Logging {

  private def executeQuery(orgId: Long, query: Query, tableCols: Array[TableColumn]): Future[DataTable] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::executeQuery") {
      queryExecutor.executeQuery(orgId, query, tableCols)
    }

  override def query(request: SqlQueryRequest): Future[SqlQueryResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::SqlQueryRequest") {
      val username: Option[String] = Try(request.currentUsername).toOption
      val query: Query = applyDecryption(request.toQuery, username)
      queryExecutor
        .executeQuery(request.getOrganizationId(), query, request.toTableColumns, formatValues = false)
        .map(dataObject => {
          SqlQueryResponse(headers = dataObject.headers, records = dataObject.records)
        })
    }

  override def query(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::ChartRequest") {
      buildQueryAndExecute(request, None)
    }

  override def query(request: QueryViewAsRequest): Future[ChartResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::queryViewAs") {
      require(request.userProfile.isDefined, "a target is required for querying as View As")
      buildQueryAndExecute(request.queryRequest, request.userProfile)
    }

  override def exportToFile(request: ChartRequest, fileType: FileType): Future[String] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::exportToFile") {
      for {
        prepareResp <- prepareQuery(request, None, None)
        csvFilePath <- queryExecutor.exportToFile(request.getOrganizationId(), prepareResp.finalQuery, fileType)
      } yield csvFilePath
    }

  private def buildQueryAndExecute(request: ChartRequest, viewAsProfile: Option[UserProfile]): Future[ChartResponse] = {
    val limit: Option[Limit] = processLimit(request)
    for {
      prepareResp <- prepareQuery(request, limit, viewAsProfile)
      chartResp <- executeAndRenderChart(
        prepareResp.finalQuery,
        request,
        request.filterRequests,
        prepareResp.relationshipInfo,
        prepareResp.rlsPolicies,
        prepareResp.tableExpressions
      )
    } yield chartResp
  }
  private def enhanceQuery(
      baseQuery: Query,
      username: Option[String],
      limit: Option[Limit],
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      expressions: Map[String, String],
      parameters: Map[String, String]
  ): Query = {
    val enhancedQuery = processAdditionalConditions(baseQuery, filterRequests, relationshipInfo)
    val decryptQuery = applyDecryption(enhancedQuery, username)
    val finalQuery = applyLimit(decryptQuery, limit)

    finalQuery.customCopy(
      rlsConditions = rlsPolicies.map(_.toRlsCondition()),
      expressions = expressions,
      parameters = parameters
    )
  }

  private def executeAndRenderChart(
      query: Query,
      request: ChartRequest,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      expressions: Map[String, String]
  ): Future[ChartResponse] = {
    val orgId: Long = request.getOrganizationId()
    request.querySetting match {
      case s: PieChartSetting =>
        toPieLikeResponse(orgId, query, s)
      case s: FunnelChartSetting =>
        toPieLikeResponse(orgId, query, s)
      case s: PyramidChartSetting =>
        toPieLikeResponse(orgId, query, s)
      case s: SeriesChartSetting =>
        toSeriesResponse(orgId, query, s, request.compareRequest)
      case s: ScatterChartSetting =>
        toScatterResponse(orgId, query, s)
      case s: BubbleChartSetting =>
        toBubbleResponse(orgId, query, s)
      case s: HeatMapChartSetting =>
        toHeatMapResponse(orgId, query, s)
      case s: TableChartSetting =>
        toTableResponse(orgId, query, s)
      case s: GroupTableChartSetting =>
        toGroupTableResponse(orgId, query, s)
      case s: NumberChartSetting =>
        toNumberResponse(orgId, query, s, request.compareRequest)
      case s: GaugeChartSetting =>
        toGaugeResponse(orgId, query, s, request.compareRequest)
      case s: DrilldownChartSetting =>
        toDrilldownResponse(orgId, query, s)
      case s: TreeMapChartSetting =>
        toTreeMapResponse(orgId, query, s)
      case s: WordCloudChartSetting =>
        toWordCloudResponse(orgId, query, s)
      case s: HistogramChartSetting =>
        toHistogramResponse(orgId, query, s)
      case s: DropdownFilterChartSetting =>
        toDropdownFilterResponse(orgId, query, s)
      case s: TabFilterChartSetting =>
        toDropdownFilterResponse(orgId, query, s)
      case s: TabControlChartSetting =>
        toDropdownFilterResponse(orgId, query, s)
      case s: InputControlChartSetting =>
        toDropdownFilterResponse(orgId, query, s)
      case s: MapChartSetting =>
        toMapResponse(orgId, query, s)
      case s: PivotTableSetting =>
        toPivotTableResponse(
          orgId,
          query,
          s,
          filterRequests,
          relationshipInfo,
          rlsPolicies,
          expressions,
          request.parameters
        )
      case s: FlattenPivotTableSetting =>
        toTableResponse(orgId, query, s)
      case s: RawQuerySetting =>
        toRawQueryResponse(orgId, query, s)
      case s: DonutChartSetting =>
        toPieLikeResponse(orgId, query, s)
      case s: ParliamentChartSetting =>
        toPieLikeResponse(orgId, query, s)
      case s: SpiderWebChartSetting =>
        toSpiderWebResponse(orgId, query, s)
      case s: BellCurveChartSetting =>
        toBellCurveResponse(orgId, query, s)
      case s: SankeyChartSetting =>
        toSankeyResponse(orgId, s, filterRequests, relationshipInfo, rlsPolicies, expressions, request.parameters)
      case s: BulletChartSetting =>
        toBulletResponse(orgId, query, s)
      case s: GenericChartSetting =>
        toGenericChartResponse(orgId, query, s)
      case _ => throw BadRequestError(s"response for setting ${request.querySetting} is not yet supported")
    }
  }

  private def fetchTablesExpression(views: Seq[QueryView]): Future[Map[String, String]] = {
    val viewsFromSql: Seq[QueryView] =
      views
        .filter(_.isInstanceOf[SqlView])
        .map(_.asInstanceOf[SqlView])
        .flatMap(sqlView => sqlView.query.allQueryViews)

    val tableViews: Seq[TableView] =
      (views ++ viewsFromSql).filter(_.isInstanceOf[TableView]).map(_.asInstanceOf[TableView])

    Future
      .collect(tableViews.map(v => schemaClientService.getExpressions(v.dbName, v.tblName)))
      .map(responses => responses.flatMap(_.expressions).toMap)
  }

  private def processAdditionalConditions(
      query: Query,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo
  ): Query = {
    query match {
      case sqlQuery: SqlQuery => sqlQuery
      case objQuery: ObjectQuery =>
        val queryViews: Seq[QueryView] = objQuery.allQueryViews
        require(queryViews.nonEmpty, "query views of objectQuery can not be empty")

        val relationshipGraph = new RelationshipGraph(relationshipInfo.relationships)
        val addedJoinConditions = mutable.Set[JoinCondition]()
        val addedConditions = ArrayBuffer[Condition]()

        val startView: QueryView = queryViews.head
        val otherViews: Seq[QueryView] = queryViews.drop(1)

        otherViews.foreach(view => {
          val relationships = relationshipGraph.findPath(startView, view)

          if (relationships.isEmpty) {
            throw BadRequestError("there is insufficient table relationships to execute this query")
          }

          addedJoinConditions ++= getJoinConditions(relationships)
        })

        filterRequests
          .filter(_.isActive)
          .foreach(filter => {
            val filterView: QueryView = filter.queryView

            if (queryViews.exists(_.aliasName == filterView.aliasName)) {
              addedConditions += filter.condition
            } else if (filter.isApplyRelatively) {
              val relationshipsPath: Seq[Relationship] = relationshipGraph.findPath(startView, filterView)

              if (relationshipsPath.nonEmpty) {
                // try to optimize query by remove joins if possible
                try {
                  require(relationshipsPath.length == 1)

                  val fieldRelatedCondition = filter.condition.asInstanceOf[FieldRelatedCondition]
                  val conditionField: Field = fieldRelatedCondition.field
                  val fieldPairs: Option[FieldPair] = relationshipsPath.head.fieldPairs
                    .find(pair => pair.firstField == conditionField || pair.secondField == conditionField)

                  require(fieldPairs.isDefined)

                  val firstField: Field = fieldPairs.get.firstField
                  val secondField: Field = fieldPairs.get.secondField

                  if (firstField == conditionField) {
                    addedConditions += fieldRelatedCondition.customCopy(secondField)
                  } else if (secondField == conditionField) {
                    addedConditions += fieldRelatedCondition.customCopy(firstField)
                  }

                } catch {
                  case e: Throwable =>
                    addedJoinConditions ++= getJoinConditions(relationshipsPath)
                    addedConditions += filter.condition // build sub-query from this condition
                }
              }
            }
          })

        val (finalConditions, finalJoinConditions) = optimizeConditions(
          conditions = objQuery.conditions ++ addedConditions.distinct,
          joinConditions = (objQuery.joinConditions ++ addedJoinConditions).distinct
        )

        objQuery.copy(
          conditions = finalConditions,
          joinConditions = finalJoinConditions
        )
    }
  }

  private def getJoinConditions(relationships: Seq[Relationship]): Seq[JoinCondition] = {
    relationships.map(rls => {
      InnerJoin(
        rls.firstView,
        rls.secondView,
        rls.fieldPairs.map(p => EqualField(p.firstField, p.secondField))
      )
    })
  }

  private def processLimit(request: ChartRequest): Option[Limit] = {
    if (request.from == -1 || request.size == -1) None else Some(Limit(request.from, request.size))
  }

  private def toPieLikeResponse(
      orgId: Long,
      query: Query,
      setting: ChartSetting
  ): Future[SeriesTwoResponse] = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toPieLikeResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val name: String = baseTable.headers(0)
        val data: Array[Array[Object]] = baseTable.records.map(r => Array(r(0).asString, r(1)))
        val total: Double = baseTable.records
          .map(r => {
            try {
              r(1).asString.toDouble
            } catch {
              case _: Throwable => 0
            }
          })
          .sum
        SeriesTwoResponse(Array(SeriesTwoItem(name, data)), total = Some(total))
      })
    }
  }

  private def toSeriesResponse(
      orgId: Long,
      query: Query,
      seriesSetting: SeriesChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSeriesResponse") {
      val invalidColumns = seriesSetting.yAxis.filter(tableColumn =>
        tableColumn.function.isInstanceOf[GroupBy] || tableColumn.function.isInstanceOf[Select]
      )
      if (invalidColumns.nonEmpty) {
        throw BadRequestError("Y axis not support group by and none, please config chart again")
      }

      compareRequest match {
        case Some(r) =>
          executeCompareQueries(orgId, query, seriesSetting, r).map {
            case (firstResponse, secondResponse) => {
              val compareResponsesMap = mutable.HashMap.empty[CompareMode, SeriesOneResponse]
              r.mode match {
                case RawValues => compareResponsesMap.put(r.mode, renderSeriesResponse(secondResponse, seriesSetting))
                case ValuesDiff =>
                  compareResponsesMap.put(
                    r.mode,
                    renderSeriesResponse(computeValuesDiff(firstResponse, secondResponse), seriesSetting)
                  )
                case PercentageDiff =>
                  compareResponsesMap.put(
                    r.mode,
                    renderSeriesResponse(computePercentageDiff(firstResponse, secondResponse), seriesSetting)
                  )
                case _ => throw BadRequestError(s"Compare mode ${r.mode} for number chart is not yet supported")
              }
              val compareResponses = Some(HashMap(compareResponsesMap.toSeq: _*))
              renderSeriesResponse(firstResponse, seriesSetting).copy(compareResponses = compareResponses)
            }
          }

        case None =>
          executeQuery(orgId, query, seriesSetting.toTableColumns).map(baseTable => {
            renderSeriesResponse(baseTable, seriesSetting)
          })
      }
    }
  }

  private def renderSeriesResponse(
      baseTable: DataTable,
      setting: SeriesChartSetting
  ): SeriesOneResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderSeriesResponse") {
      if (baseTable.records.length == 0)
        return SeriesOneResponse(Array.empty, xAxis = Some(Array.empty))

      if (setting.legend.isDefined || setting.breakdown.isDefined) {
        val recordsTransposed = baseTable.records.transpose
        val xAxis = recordsTransposed(0).map(_.asString) // [a,b,c,d]
        val data = recordsTransposed.slice(1, recordsTransposed.length) // [[1,2,3,4]...]
        val names = baseTable.headers.slice(1, recordsTransposed.length) // [Asia.food, Asia.drink...]
        val series = data
          .zip(names)
          .map(r => {
            val stackValue: Option[String] = setting.breakdown match {
              case Some(_) =>
                if (setting.legend.isDefined) Some(r._2.split('.').head) // Asia
                else Some("")
              case None => Some(r._2)
            }
            SeriesOneItem(r._2, r._1, stackValue) // (Asia.food, [1,2,3,4], Asia)
          })
        SeriesOneResponse(series, Some(xAxis))
      } else {
        val numCols = baseTable.headers.length
        val recordsTransposed = baseTable.records.transpose
        val series = ArrayBuffer.empty[SeriesOneItem]
        for (i <- 1 until numCols) {
          val name = baseTable.headers(i)
          val data = recordsTransposed(i)
          series += SeriesOneItem(name, data)
        }
        val xAxis: Array[String] = recordsTransposed(0).map(_.asString)
        SeriesOneResponse(series.toArray, xAxis = Some(xAxis))
      }
    }

  private def toBellCurveResponse(
      orgId: Long,
      query: Query,
      setting: BellCurveChartSetting
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toBellCurveResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        if (baseTable.headers.isEmpty && isNumCol(baseTable.colTypes(0)))
          throw BadRequestError("Current config is not compatible with bell curve chart")

        val name: String = baseTable.headers(0)
        val data: Array[Object] = baseTable.records.map(r => r(0))
        SeriesOneResponse(series = Array(SeriesOneItem(name, data)))
      })
    }

  private def toScatterResponse(orgId: Long, query: Query, setting: ScatterChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toScatterResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val records = baseTable.records
        val colTypes = baseTable.colTypes
        val series = ArrayBuffer.empty[SeriesTwoItem]
        setting.legend match {
          case Some(_) =>
            if (colTypes.length > 3 || !isNumCol(colTypes(1)) || !isNumCol(colTypes(2)))
              throw BadRequestError(
                "Current config is not compatible with scatter chart, scatter chart need 2 numeric columns"
              )
            records.groupBy(r => r(0).asString).foreach {
              case (key, row) => series += SeriesTwoItem(key, row.map(r => Array(r(1), r(2))))
            }
            SeriesTwoResponse(series.toArray)

          case None =>
            if (colTypes.length > 2 || !isNumCol(colTypes(0)) || !isNumCol(colTypes(1)))
              throw BadRequestError(
                "Current config is not compatible with scatter chart, scatter chart need 2 numeric columns"
              )

            series += SeriesTwoItem("", records.map(r => Array(r(0), r(1))))
            SeriesTwoResponse(series.toArray)
        }
      })
    }

  private def toBubbleResponse(orgId: Long, query: Query, setting: BubbleChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toBubbleResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val records = baseTable.records
        val colTypes = baseTable.colTypes
        val series = ArrayBuffer.empty[SeriesTwoItem]
        setting.legend match {
          case Some(_) =>
            if (colTypes.length != 4)
              throw BadRequestError("Current config is not compatible with bubble chart")
            else if (!isNumCol(colTypes(1)) || !isNumCol(colTypes(2)) || !isNumCol(colTypes(3)))
              throw BadRequestError(
                "Current config is not compatible with bubble chart, bubble chart need 3 numeric columns"
              )

            records.groupBy(r => r(0).asString).foreach {
              case (key, row) => series += SeriesTwoItem(key, row.map(r => Array(r(1), r(2), r(3))))
            }
            SeriesTwoResponse(series.toArray)

          case None =>
            if (colTypes.length > 3 || !isNumCol(colTypes(0)) || !isNumCol(colTypes(1)) || !isNumCol(colTypes(2)))
              throw BadRequestError(
                "Current config is not compatible with bubble chart, bubble chart need 3 numeric columns"
              )

            series += SeriesTwoItem("", records.map(r => Array(r(0), r(1), r(2))))
            SeriesTwoResponse(series.toArray)
        }
      })
    }

  private def toHeatMapResponse(orgId: Long, query: Query, setting: HeatMapChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toHeatMapResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val headers = baseTable.headers
        val records = baseTable.records
        val colTypes = baseTable.colTypes
        val seriesName = setting.value.name
        val xAxis = headers.slice(1, headers.length).map(_.asInstanceOf[Object])

        if (colTypes.slice(1, colTypes.length).exists(c => !isNumCol(c)))
          throw BadRequestError("Current config is not compatible with heat map chart or current data is empty")

        if (records.nonEmpty) {
          var x = 0
          val data = ArrayBuffer[Array[Object]]()
          records.zipWithIndex.foreach {
            case (row, y) =>
              x = 0
              row.zipWithIndex.foreach {
                case (z, i) =>
                  if (i != 0) {
                    data += Array(x.asInstanceOf[Object], y.asInstanceOf[Object], z)
                    x += 1
                  }
              }
          }
          val yAxis = records.map(r => r(0).asString).map(_.asInstanceOf[Object])
          SeriesTwoResponse(Array(SeriesTwoItem(seriesName, data.toArray)), Some(xAxis), Some(yAxis))
        } else {
          SeriesTwoResponse(Array(SeriesTwoItem(seriesName, Array.empty)), Some(xAxis), Some(Array.empty))
        }
      })
    }

  private def toTableResponse(orgId: Long, query: Query, setting: ChartSetting): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toTableResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
        total <- getTotal(orgId, query)
        minMaxPairs <- getMinMaxPairs(orgId, query, setting.toTableColumns)
      } yield {
        val (headers, records) = renderJsonTabularResponse(baseTable, setting.toTableColumns)
        JsonTableResponse(
          headers,
          records,
          total,
          minMaxPairs
        )
      }
    }

  private def getTotal(orgId: Long, query: Query, useFirstGroupOnly: Boolean = false): Future[Long] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotal") {
      query match {
        case objQuery: ObjectQuery => getTotalOfObjQuery(orgId, objQuery, useFirstGroupOnly)
        case sqlQuery: SqlQuery    => getTotalOfSqlQuery(orgId, sqlQuery)
      }
    }

  private def getMinMaxPairs(orgId: Long, query: Query, tableCols: Array[TableColumn]): Future[Seq[MinMaxPair]] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getMinMaxPairs") {
      query match {
        case objQuery: ObjectQuery =>
          val calcMinMaxCols: Array[TableColumn] = tableCols.filter(c => c.isCalcMinMax)
          val otherCols: Array[TableColumn] = tableCols.filterNot(c => c.isCalcMinMax)
          Future.collect(calcMinMaxCols.map(col => queryMinMaxValues(orgId, otherCols.map(_.function), col, objQuery)))
        case _ => throw BadRequestError(s"get total rows num of query $query is not supported")
      }
    }

  private def toGroupTableResponse(
      orgId: Long,
      query: Query,
      setting: GroupTableChartSetting
  ): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toGroupTableResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
        total <- getTotal(orgId, query, useFirstGroupOnly = true)
        minMaxPairs <- getMinMaxPairs(orgId, query, setting.toTableColumns)
      } yield {
        val (headers, records) = renderJsonPivotResponse(baseTable, setting.toTableColumns)
        JsonTableResponse(
          headers,
          records,
          total,
          minMaxPairs
        )
      }
    }

  private def getTotalOfObjQuery(orgId: Long, objQuery: ObjectQuery, useFirstGroupOnly: Boolean): Future[Long] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotalOfObjQuery") {
      val groupedColumnsObjQuery: Query = toGroupedColumnsObjQuery(objQuery, useFirstGroupOnly)
      for {
        groupedColumnsSql: String <- queryExecutor.parseQuery(orgId, groupedColumnsObjQuery)
        countSql: String = ClickhouseParser.toCountSql(groupedColumnsSql)
        dataTable: DataTable <- queryExecutor.execute(orgId, countSql)
      } yield dataTable.records(0)(0).asString.toLong
    }

  /**
    * build special query to find total row for pivot table
    * @param baseObjQuery input query
    * @return query which only contain first function column
    */
  private def toGroupedColumnsObjQuery(baseObjQuery: ObjectQuery, useFirstGroupOnly: Boolean = false): ObjectQuery = {
    require(baseObjQuery.functions.nonEmpty, "functions can not be empty when build FirstColumnObjQuery")

    val groupFunctions: Seq[Function] = if (isGroupedQuery(baseObjQuery)) {
      val groupBys: Seq[GroupBy] = baseObjQuery.functions.filter(_.isGroupByFunc).map(_.asInstanceOf[GroupBy])
      if (useFirstGroupOnly) {
        groupBys.take(1)
      } else groupBys
    } else {
      if (useFirstGroupOnly) {
        baseObjQuery.functions.take(1)
      } else baseObjQuery.functions
    }

    baseObjQuery.copy(functions = groupFunctions, orders = Seq.empty, limit = None)
  }

  private def getTotalOfSqlQuery(orgId: Long, sqlQuery: SqlQuery): Future[Long] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotalOfSqlQuery") {
      for {
        baseQuery: String <- queryExecutor.parseQuery(orgId, sqlQuery)
        countSql: String = ClickhouseParser.toCountSql(baseQuery)
        resultTable: DataTable <- queryExecutor.execute(orgId, countSql)
      } yield {
        resultTable.records(0)(0).asString.toLong
      }
    }

  private def toNumberResponse(
      orgId: Long,
      query: Query,
      setting: ChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toNumberResponse") {
      compareRequest match {
        case Some(r) =>
          executeCompareQueries(orgId, query, setting, r).map {
            case (baseResp, compareResp) =>
              val compareResponsesMap = mutable.HashMap.empty[CompareMode, SeriesOneResponse]
              r.mode match {
                case RawValues => compareResponsesMap.put(r.mode, renderNumberResponse(compareResp))
                case ValuesDiff =>
                  compareResponsesMap.put(r.mode, renderNumberResponse(computeValuesDiff(baseResp, compareResp)))
                case PercentageDiff =>
                  compareResponsesMap.put(r.mode, renderNumberResponse(computePercentageDiff(baseResp, compareResp)))
                case _ => throw BadRequestError(s"Compare mode ${r.mode} for number chart is not yet supported")
              }
              val compareResponses = Some(HashMap(compareResponsesMap.toSeq: _*))

              renderNumberResponse(baseResp).copy(compareResponses = compareResponses)
          }

        case None =>
          executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
            renderNumberResponse(baseTable)
          })
      }
    }

  private def renderNumberResponse(baseTable: DataTable): SeriesOneResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderNumberResponse") {
      val colTypes = baseTable.colTypes
      if (colTypes.length == 1 && isNumCol(colTypes(0))) {
        val name = baseTable.headers(0)
        if (baseTable.records(0).length == 1 && baseTable.records(0)(0) != null) {
          val num = baseTable.records(0)(0)
          SeriesOneResponse(series = Array(SeriesOneItem(name, Array(num))))
        } else {
          SeriesOneResponse(series = Array(SeriesOneItem(name, Array(0.asInstanceOf[Object]))))
        }
      } else throw BadRequestError("Number chart has to have type of number")
    }

  private def toGaugeResponse(
      orgId: Long,
      query: Query,
      setting: ChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toGaugeResponse") {
      compareRequest match {
        case Some(r) =>
          executeCompareQueries(orgId, query, setting, r).map {
            case (baseResp, compareResp) =>
              val compareResponsesMap = mutable.HashMap.empty[CompareMode, SeriesOneResponse]
              r.mode match {
                case RawValues => compareResponsesMap.put(r.mode, renderNumberResponse(compareResp))
                case ValuesDiff =>
                  compareResponsesMap.put(r.mode, renderGaugeResponse(computeValuesDiff(baseResp, compareResp)))
                case PercentageDiff =>
                  compareResponsesMap.put(r.mode, renderGaugeResponse(computePercentageDiff(baseResp, compareResp)))
                case _ => throw BadRequestError(s"Compare mode ${r.mode} for number chart is not yet supported")
              }
              val compareResponses = Some(HashMap(compareResponsesMap.toSeq: _*))
              renderGaugeResponse(baseResp).copy(compareResponses = compareResponses)

          }

        case None =>
          executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
            renderGaugeResponse(baseTable)
          })
      }
    }

  private def renderGaugeResponse(baseTable: DataTable): SeriesOneResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderGaugeResponse") {
      val colTypes = baseTable.colTypes
      if (colTypes.length == 1 && isNumCol(colTypes(0))) {
        if (baseTable.records.length > 0 && baseTable.records(0)(0) != null) {
          val name = baseTable.headers(0)
          val num = baseTable.records(0)(0)
          SeriesOneResponse(series = Array(SeriesOneItem(name, Array(num))))
        } else {
          SeriesOneResponse(series = Array(SeriesOneItem(baseTable.headers(0), Array.empty)))
        }
      } else throw BadRequestError("Current config is not compatible with gauge chart")
    }

  private def toDrilldownResponse(
      orgId: Long,
      query: Query,
      setting: DrilldownChartSetting
  ): Future[DrilldownResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDrilldownResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val isGroupBys = baseTable.isGroupCols
        val name = setting.legends(0).name
        val series: Array[DrilldownValue] = toDrilldownSeries(baseTable.records, isGroupBys)
        val drilldown: Array[DrilldownItem] = toDrilldownDetails(baseTable.records, isGroupBys)
        DrilldownResponse(name, series, drilldown)
      })
    }

  private def toTreeMapResponse(orgId: Long, query: Query, setting: TreeMapChartSetting): Future[TreeMapResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toTreeMapResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val isGroupBys = baseTable.isGroupCols
        val (data, groups) = toTreeMapData(baseTable.records, isGroupBys)
        val name = setting.legends(0).name
        TreeMapResponse(name, data, groups)
      })
    }

  private def toWordCloudResponse(
      orgId: Long,
      query: Query,
      setting: WordCloudChartSetting
  ): Future[WordCloudResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toWordCloudResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        if (isResultTblValidForWordCloudChart(baseTable.colTypes))
          renderWordCloudResponse(baseTable.records)
        else throw BadRequestError("Current config is not compatible with word cloud chart")
      })
    }

  // TODO: sankey not support build multiple breakdown layer yet, currently only use first item in breakdown list
  private def toSankeyResponse(
      orgId: Long,
      setting: SankeyChartSetting,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      expressions: Map[String, String],
      parameters: Map[String, String]
  ): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSankeyResponse") {
      if (setting.breakdowns.nonEmpty) {
        val firstHalfQuery: Query = enhanceQuery(
          baseQuery = setting.buildSankeyQuery(setting.source, setting.breakdowns(0)),
          username = None,
          limit = None,
          filterRequests = filterRequests,
          relationshipInfo = relationshipInfo,
          rlsPolicies = rlsPolicies,
          expressions = expressions,
          parameters = parameters
        )

        val secondHalfQuery = enhanceQuery(
          baseQuery = setting.buildSankeyQuery(setting.breakdowns(0), setting.destination),
          username = None,
          limit = None,
          filterRequests = filterRequests,
          relationshipInfo = relationshipInfo,
          rlsPolicies = rlsPolicies,
          expressions = expressions,
          parameters = parameters
        )

        for {
          firstBaseTable <- executeQuery(orgId, firstHalfQuery, setting.toTableColumns)
          secondBaseTable <- executeQuery(orgId, secondHalfQuery, setting.toTableColumns)
        } yield {
          SeriesTwoResponse(
            Array(
              SeriesTwoItem(
                name = "",
                data = normalizeSankeyData(firstBaseTable.records) ++ normalizeSankeyData(secondBaseTable.records)
              )
            )
          )
        }

      } else {
        val query = enhanceQuery(
          baseQuery = setting.buildSankeyQuery(setting.source, setting.destination),
          username = None,
          limit = None,
          filterRequests = filterRequests,
          relationshipInfo = relationshipInfo,
          rlsPolicies = rlsPolicies,
          expressions = expressions,
          parameters = parameters
        )

        executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
          SeriesTwoResponse(Array(SeriesTwoItem(name = "", data = normalizeSankeyData(baseTable.records))))
        })
      }

    }

  private def toBulletResponse(orgId: Long, query: Query, setting: BulletChartSetting): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toBulletResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        if (setting.breakdown.isDefined) {
          val seriesOneItems: Array[SeriesOneItem] =
            baseTable.records.map(r => SeriesOneItem(name = r(0).asString, data = r.drop(1)))

          SeriesOneResponse(series = seriesOneItems)
        } else {
          val labels: Array[Object] = setting.values.map(_.name)
          val records: Array[Array[Object]] = (labels +: baseTable.records).transpose
          val seriesOneItems: Array[SeriesOneItem] =
            records.map(r => SeriesOneItem(name = r(0).asString, data = r.drop(1)))

          SeriesOneResponse(series = seriesOneItems)
        }
      })
    }

  // for highchart to display null value
  private def normalizeSankeyData(records: Array[Array[Object]]): Array[Array[Object]] = {
    records.map(row => {
      val source: Object =
        if (row(0) == null || row(0).asInstanceOf[String] == "") "<null>".asInstanceOf[Object] else row(0)
      val dest: Object =
        if (row(1) == null || row(1).asInstanceOf[String] == "") row(0) else row(1)
      Array(source, dest, row(2))
    })
  }

  private def toTreeMapData(
      records: Array[Array[Object]],
      isGroupBys: Array[Boolean]
  ): (Array[TreeMapItem], Array[String]) =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toTreeMapData") {
      val groupIndexes = isGroupBys.zipWithIndex.filter(_._1).map(_._2)
      val totalNumGroup = groupIndexes.length
      val treeMapData = ArrayBuffer.empty[TreeMapItem]
      val parentGroupNames = ArrayBuffer.empty[String]

      for (numGroup <- 1 to totalNumGroup) {
        val intervals = findGroupIntervals(records, groupIndexes, numGroup)
        intervals.foreach {
          case (l, _) =>
            val groupIndex = groupIndexes(numGroup - 1)
            if (groupIndex + 1 >= records(l).length)
              throw BadRequestError("More group field than expected")
            val id = getCurGroupKey(groupIndex, isGroupBys, records(l))
            val name = records(l)(groupIndex).asString
            val value = records(l)(groupIndex + 1)
            val parent =
              if (numGroup > 1) getCurGroupKey(groupIndexes(numGroup - 2), isGroupBys, records(l))
              else null

            if (numGroup == 1) parentGroupNames += name
            treeMapData += TreeMapItem(id, name, value, value, parent)
        }
      }
      (treeMapData.toArray, parentGroupNames.toArray)
    }

  private def toHistogramResponse(
      orgId: Long,
      query: Query,
      setting: HistogramChartSetting
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toHistogramResponse") {
      for {
        resultTbl: DataTable <- queryExecutor.executeHistogramQuery(
          orgId = orgId,
          field = setting.value.function,
          baseQuery = query,
          numBins = setting.binsNumber
        )
      } yield renderHistogramResponse(resultTbl, setting.value.name)
    }

  private def toDropdownFilterResponse(orgId: Long, query: Query, setting: ChartSetting): Future[VizTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDropdownFilterResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
      } yield {
        val headers = Array("label", "value")
        val records = baseTable.records
        VizTableResponse(headers, records, records.length)
      }
    }

  private def toGenericChartResponse(
      orgId: Long,
      query: Query,
      setting: GenericChartSetting
  ): Future[GenericChartResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toGenericChartResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
      } yield {
        val headers = baseTable.headers
        val records = baseTable.records
        GenericChartResponse(headers, records, records.length)
      }
    }

  /**
    * geolocation code in conduct from user-mapped code and auto-detect code using normalize name
    * user-mapped code is define in setting
    * auto detect code is string processing algo:
    * - remove special chars
    * - multi word string is concat by underscore
    */
  private def toMapResponse(orgId: Long, query: Query, setting: MapChartSetting): Future[MapResponse] = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toMapResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
        locations <- geolocationService.list(setting.geoArea)
      } yield {
        val colTypes: Array[String] = baseTable.colTypes
        if (colTypes.slice(1, colTypes.length).exists(c => !isNumCol(c))) {
          throw BadRequestError("Current configuration is not compatible with map chart")
        }
        val usersMapping: Map[String, Geocode] = Serializer.fromJson[Map[String, Geocode]](setting.normalizedNameMap)
        val normalizedNamesMapping: Map[String, Geocode] = locations.map(loc => (loc.normalizedName, loc.code)).toMap
        val locationNames: Seq[String] = locations.map(_.normalizedName)
        val locData: Array[MapItem] = baseTable.records.map(row => {
          val code: Geocode = detectGeocode(row(0).asString, locationNames, normalizedNamesMapping, usersMapping)
          MapItem(code, row(0).asString, row(1))
        })
        val knownLocations: Array[Geocode] = locData.map(_.code)
        val unknownLocData: Array[MapItem] =
          locations.toArray
            .filterNot(loc => knownLocations.contains(loc.code))
            .map(loc => MapItem(loc.code, loc.name, null))

        MapResponse(
          data = locData.filterNot(_.code == "unknown") ++ unknownLocData,
          unknownData = locData.filter(_.code == "unknown")
        )
      }
    }
  }

  private def detectGeocode(
      locationName: String,
      normalizedNames: Seq[String],
      normalizedNamesMapping: Map[String, Geocode],
      userDefinedMap: Map[String, Geocode]
  ): Geocode =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::detectGeocode") {
      val normalizedName: String =
        findClosestString(normalizeVietnamese(locationName), normalizedNames).getOrElse("unknown")
      userDefinedMap.getOrElse(locationName, normalizedNamesMapping.getOrElse(normalizedName, "unknown"))
    }

  private def toRawQueryResponse(orgId: Long, query: Query, setting: ChartSetting): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toRawQueryResponse") {
      for {
        baseTable <- executeQuery(orgId, query, setting.toTableColumns)
        total <- getTotal(orgId, query)
      } yield {
        val (headers, records) = renderJsonTabularResponse(baseTable, setting.toTableColumns)

        JsonTableResponse(
          headers,
          records,
          total
        )
      }
    }

  private def toPivotTableResponse(
      orgId: Long,
      query: Query,
      setting: PivotTableSetting,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      expressions: Map[String, String],
      parameters: Map[String, String]
  ): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toPivotTableResponse") {
      async {
        val invalidColumns = (setting.rows ++ setting.columns).filterNot(_.function.isInstanceOf[GroupBy])
        if (invalidColumns.nonEmpty)
          throw BadRequestError(
            "Current config is not compatible with pivot table chart, just support group by for columns and rows"
          )
        val baseTable: DataTable = executeQuery(orgId, query, setting.toTableColumns).syncGet()
        if (baseTable.headers.length > 1000)
          throw BadRequestError(
            """unable to display because response table contains more than 1000 columns,
              please limit columns by filter and try again""".stripMargin
          )

        val (headers, records) = renderJsonPivotResponse(baseTable, setting.toTableColumns)

        val pivotTableHeaders: JsonNode = {
          if (setting.columns.isEmpty && setting.rows.nonEmpty && setting.values.nonEmpty) {
            val grandTotalQuery: Query = enhanceQuery(
              baseQuery = setting.toGrandTotalQuery,
              username = None,
              limit = None,
              filterRequests = filterRequests,
              relationshipInfo = relationshipInfo,
              rlsPolicies = rlsPolicies,
              expressions = expressions,
              parameters = parameters
            )

            val grandTotalBaseResp: DataTable =
              executeQuery(orgId, grandTotalQuery, setting.toGrandTotalTableColumns).syncGet()

            // add grand total if no child column is found
            for (i <- setting.toGrandTotalTableColumns.indices) {
              headers
                .get(i + 1)
                .asInstanceOf[ObjectNode]
                .put("total", grandTotalBaseResp.records.head(i).asString)
            }

            headers

          } else if (setting.columns.nonEmpty) {
            val horizontalTotalQuery = enhanceQuery(
              baseQuery = setting.toHorizontalTotalQuery,
              username = None,
              limit = None,
              filterRequests = filterRequests,
              relationshipInfo = relationshipInfo,
              rlsPolicies = rlsPolicies,
              expressions = expressions,
              parameters = parameters
            )

            val horizontalTotalBaseResp: DataTable =
              executeQuery(orgId, horizontalTotalQuery, setting.toHorizontalTableColumns).syncGet()

            renderJsonHeadersForPivotTable(horizontalTotalBaseResp, headers, setting)

          } else {
            headers
          }
        }

        val total: Long = getTotal(orgId, query, useFirstGroupOnly = true).syncGet()
        val minMaxPairs: Seq[MinMaxPair] = getMinMaxPairs(orgId, query, setting.toTableColumns).syncGet()

        JsonTableResponse(
          pivotTableHeaders,
          records,
          total,
          minMaxPairs
        )
      }
    }

  private def renderJsonHeadersForPivotTable(
      horizontalTotalBaseTbl: DataTable,
      baseJsonHeaders: JsonNode,
      setting: PivotTableSetting
  ): JsonNode = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::processPivotTableHeaders") {
      val valueCols: Array[TableColumn] = setting.values ++ setting.formatters
      val numValueCols: Int = valueCols.length
      val numGroup: Int = setting.columns.length
      val numVerGroup: Int = setting.rows.length
      val finalHeadersJson: ArrayNode = mapper.createArrayNode()
      val headersLength: Int = baseJsonHeaders.size()
      val horTotalHeaders: Array[String] = horizontalTotalBaseTbl.headers

      var currentIndex: Int = 0

      if (numVerGroup > 0) {
        finalHeadersJson.add(baseJsonHeaders.get(currentIndex)) // if there is at least 1 group in row function
        currentIndex += 1
      }

      if (setting.rows.exists(c => c.isCalcGroupTotal)) {
        valueCols.foreach(_ => {
          finalHeadersJson.add(baseJsonHeaders.get(currentIndex)) // if row function has isCalcGroupTotal turned on
          currentIndex += 1
        })
      }

      val horizontalTotalMap = mutable.HashMap.empty[String, Array[Object]]
      // build horizontal total map
      horizontalTotalBaseTbl.records.foreach(row => {
        if (numValueCols <= 1) {
          val headerStr: String = row.dropRight(numValueCols).mkString(".")
          horizontalTotalMap.put(headerStr, row)
        } else {
          valueCols.foreach(c => {
            val headerStr: String = row.dropRight(numValueCols).mkString(".") + s" - ${c.name}"
            horizontalTotalMap.put(headerStr, row)
          })
        }
      })

      val jsonNodeMap = mutable.HashMap.empty[String, JsonNode]
      // build nested headers
      for (i <- currentIndex until headersLength) {
        val baseHeaderLabel: String = baseJsonHeaders.get(i).get("label").textValue()
        val key: JsonNode = baseJsonHeaders.get(i).get("key")
        val formatterKey: Option[String] = {
          if (baseJsonHeaders.get(i).has("formatter_key")) Some(baseJsonHeaders.get(i).get("formatter_key").textValue())
          else None
        }

        horizontalTotalMap.get(baseHeaderLabel) match {
          case Some(row) =>
            for (i <- 1 to numGroup) {
              // loop qua moi tang cua header, gan cac lien ket cha con dua vao gia tri cua flat header
              val curGroupStr: String = row.take(i).mkString(".") // rule to build header name, do not change
              val parentNode: ArrayNode =
                if (i == 1) finalHeadersJson
                else jsonNodeMap(row.take(i - 1).mkString(".")).get("children").asInstanceOf[ArrayNode]
              val node: JsonNode = if (!jsonNodeMap.contains(curGroupStr)) {
                val arr: ArrayNode = mapper.createArrayNode()

                val newNode: ObjectNode = mapper.createObjectNode()
                newNode.put("label", row(i - 1).asString)
                newNode.set("children", arr)

                parentNode.add(newNode)
                jsonNodeMap.put(curGroupStr, newNode)
                newNode
              } else {
                jsonNodeMap(curGroupStr)
              }
              // process leaf node
              if (i == numGroup) {
                if (numValueCols == 0) {
                  node.asInstanceOf[ObjectNode].set("key", key)
                } else if (numValueCols == 1) { // only 1 value -> put value to current node
                  node.asInstanceOf[ObjectNode].put("total", row(i).asString)
                  node.asInstanceOf[ObjectNode].put("is_text_left", false)
                  node.asInstanceOf[ObjectNode].set("key", key)
                } else { // if more than 1 value -> find correct column and insert
                  val columnIndex: Int = horTotalHeaders.indexWhere(h => baseHeaderLabel.contains(h))
                  val children: ArrayNode = node.get("children").asInstanceOf[ArrayNode]

                  val aggregationNode: ObjectNode = mapper.createObjectNode()
                  aggregationNode.put("label", horTotalHeaders(columnIndex))
                  aggregationNode.put("total", row(columnIndex).asString)
                  aggregationNode.put("is_text_left", false)
                  aggregationNode.set("key", key)
                  if (formatterKey.isDefined) aggregationNode.put("formatter_key", formatterKey.get)

                  children.add(aggregationNode)
                }
              }
            }
          case None =>
        }
      }

      finalHeadersJson
    }
  }

  private def toSpiderWebResponse(
      orgId: Long,
      query: Query,
      setting: SpiderWebChartSetting
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSpiderWebResponse") {
      executeQuery(orgId, query, setting.toTableColumns).map(baseTable => {
        val numCols = baseTable.headers.length
        val recordsTransposed = baseTable.records.transpose
        val series = ArrayBuffer.empty[SeriesOneItem]
        if (baseTable.records.nonEmpty) {
          for (i <- 1 until numCols) {
            val name = baseTable.headers(i)
            val data = recordsTransposed(i)
            series += SeriesOneItem(name, data)
          }
          val xAxis = recordsTransposed(0).map(_.asString)
          SeriesOneResponse(series.toArray, xAxis = Some(xAxis))
        } else {
          SeriesOneResponse(Array.empty, xAxis = Some(Array.empty))
        }
      })
    }

  private def renderHistogramResponse(table: DataTable, valueName: String): SeriesOneResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderHistogramResponse") {
      val intervals = table.records.map(r => {
        val lower = PrettyNumberFormatter.format(r(0))
        val upper = PrettyNumberFormatter.format(r(1))
        s"[$lower, $upper]"
      })
      val data = table.records.map(r => DoubleFormatter.format(r(2)))
      val item = SeriesOneItem(name = valueName, data = data)
      SeriesOneResponse(series = Array(item), xAxis = Some(intervals))
    }

  private def findGroupIntervals(
      records: Array[Array[Object]],
      groupColIndexes: Array[Int],
      numGroup: Int
  ): Array[(Int, Int)] = {
    val res = ArrayBuffer.empty[(Int, Int)]
    var l = 0
    var h = 0
    while (l < records.length) {
      var flag = true
      h = l
      while (h < records.length && flag) {
        for (i <- 0 until numGroup) if (records(h)(groupColIndexes(i)) != records(l)(groupColIndexes(i))) flag = false
        if (flag) h += 1
      }
      res += Tuple2(l, h)
      l = h
    }
    res.toArray
  }

  private def toDrilldownSeries(records: Array[Array[Object]], isGroupBys: Array[Boolean]): Array[DrilldownValue] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDrilldownSeries") {
      val groupIndexes = isGroupBys.zipWithIndex.filter(_._1).map(_._2)
      val intervals = findGroupIntervals(records, groupIndexes, 1)
      intervals.map {
        case (l, _) =>
          val key = getCurGroupKey(0, isGroupBys, records(l))
          DrilldownValue(records(l)(0).asString, records(l)(1), key)
      }
    }

  private def toDrilldownDetails(records: Array[Array[Object]], isGroupBys: Array[Boolean]): Array[DrilldownItem] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDrilldownDetails") {
      val groupIndexes = isGroupBys.zipWithIndex.filter(_._1).map(_._2)
      val totalNumGroup = groupIndexes.length
      val drilldownMap = mutable.HashMap.empty[String, ArrayBuffer[DrilldownValue]]
      for (numGroup <- 2 to totalNumGroup) {
        val intervals = findGroupIntervals(records, groupIndexes, numGroup)
        intervals.foreach {
          case (l, _) =>
            val parentKey = getCurGroupKey(groupIndexes(numGroup - 2), isGroupBys, records(l))
            val groupIndex = groupIndexes(numGroup - 1)
            val childKey = getCurGroupKey(groupIndex, isGroupBys, records(l))
            if (drilldownMap.contains(parentKey)) {
              drilldownMap(parentKey) += DrilldownValue(
                records(l)(groupIndex).asString,
                records(l)(groupIndex + 1),
                childKey
              )
            } else {
              drilldownMap.put(
                parentKey,
                ArrayBuffer(
                  DrilldownValue(records(l)(groupIndex).asString, records(l)(groupIndex + 1), childKey)
                )
              )
            }
        }
      }
      drilldownMap.map(item => DrilldownItem(item._1, item._1, item._2.toArray)).toArray
    }

  private def isResultTblValidForWordCloudChart(colTypes: Array[String]): Boolean = {
    if (colTypes.length != 2) return false
    if (!isNumCol(colTypes(1))) return false
    true
  }

  private def renderWordCloudResponse(records: Array[Array[Object]]): WordCloudResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderWordCloudResponse") {
      val data = records.map(r => WordCloudItem(r(0).asString, r(1)))
      val name = ""
      WordCloudResponse(name, data)
    }

  private def isNumCol(colType: String): Boolean = {
    val lowerCaseType: String = colType.toLowerCase
    val patterns = Array("int", "float", "double", "dec", "num")
    patterns.exists(pattern => lowerCaseType.contains(pattern))
  }

  private def renderJsonTabularResponse(
      resultTbl: DataTable,
      tableCols: Array[TableColumn]
  ): (JsonNode, JsonNode) =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderJsonTabularResponse") {
      val headersJson: ArrayNode = mapper.createArrayNode()
      val recordsJson: ArrayNode = mapper.createArrayNode()

      val isGroupCols = resultTbl.isGroupCols
      val isTextLefts = resultTbl.colTypes.map(c => !isNumCol(c))

      resultTbl.headers.zipWithIndex.foreach {
        case (h, i) =>
          val item: ObjectNode = mapper.createObjectNode()
          item.put("key", i.toString)
          item.put("label", h)
          item.put("is_group_by", isGroupCols(i))
          item.put("is_text_left", isTextLefts(i))
          if (i < tableCols.length) {
            item.put("formatter_key", tableCols(i).formatterKey.getOrElse(""))
          }

          headersJson.add(item)
      }

      resultTbl.records.foreach(row => {
        val item: ObjectNode = mapper.createObjectNode()
        row.zipWithIndex.foreach {
          case (value, index) => if (value != null) item.put(index.toString, value.asString)
        }
        if (item.size() > 0) recordsJson.add(item)
      })

      (headersJson, recordsJson)
    }

  private def renderJsonPivotResponse(
      resultTbl: DataTable,
      tableCols: Array[TableColumn]
  ): (JsonNode, JsonNode) = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderJsonPivotResponse") {
      val headersJson: ArrayNode = mapper.createArrayNode()
      val recordsJson: ArrayNode = mapper.createArrayNode()

      val isGroupCols = resultTbl.isGroupCols
      val isTextLeft = resultTbl.colTypes.map(c => !isNumCol(c))
      val map: mutable.HashMap[String, ObjectNode] = mutable.HashMap.empty
      var curGroupKey: String = null
      var node: ObjectNode = null

      val headerKeyMap = mutable.HashMap[Int, String]()

      val formatterKeys: Array[String] = buildFormatterCols(isGroupCols, tableCols)
      var cnt: Int = 0
      var cur: Int = 0

      resultTbl.headers.zipWithIndex.foreach {
        case (header, i) =>
          if (isGroupCols(i)) cur = 0

          if (cnt <= cur) {
            headerKeyMap(i) = StringUtils.shortMd5(header) // map same key for column across multiple requests

            val item: ObjectNode = mapper.createObjectNode()
            item.put("key", headerKeyMap(i))
            item.put("label", header.asString)
            item.put("is_group_by", isGroupCols(i))
            item.put("is_text_left", isTextLeft(i))
            if (formatterKeys.nonEmpty && formatterKeys(i).nonEmpty) {
              item.put("formatter_key", formatterKeys(i))
            }

            headersJson.add(item)
            cnt += 1
          }

          cur += 1
      }

      resultTbl.records.foreach(row => {
        cur = 0

        for (i <- row.indices) {
          curGroupKey = getCurGroupKey(i, isGroupCols, row)

          // if group col, current group is child of previous group
          if (isGroupCols(i)) {
            cur = 0
            // if node already created, use that node
            if (map.contains(curGroupKey)) {
              node = map(curGroupKey)
            } else {
              // first group, create new object node, add to records
              if (i == 0) {
                val arr: ArrayNode = mapper.createArrayNode()

                val curNode: ObjectNode = mapper.createObjectNode()
                curNode.set("children", arr)
                curNode.put(headerKeyMap(cur), row(i).asString)

                recordsJson.add(curNode)
                map.put(curGroupKey, curNode)
                node = curNode
              }
              // else later group, add new node to children of previous node
              else {
                val children = node.get("children").asInstanceOf[ArrayNode]
                val arr: ArrayNode = mapper.createArrayNode()

                val curNode: ObjectNode = mapper.createObjectNode()
                curNode.set("children", arr)
                curNode.put(headerKeyMap(cur), row(i).asString)

                children.add(curNode)
                map.put(curGroupKey, curNode)
                node = curNode
              }
            }
          }
          // add attribute to current group (current node)
          else {
            if (i == 0) {
              node = mapper.createObjectNode()
              recordsJson.add(node)
            }

            if (row(i) != null) node.put(headerKeyMap(cur), row(i).asString)
          }
          cur += 1
        }
      })

      (headersJson, recordsJson)
    }
  }

  // only works on json pivot table
  private def buildFormatterCols(isGroupBys: Array[Boolean], tableColumns: Array[TableColumn]): Array[String] = {
    val colCount = isGroupBys.length
    val aggFnCount: Int = tableColumns.map(_.function).count(_.isAggregateFunc)
    val formatterCols: Array[TableColumn] = tableColumns.filter(_.formatterKey.isDefined)

    if (isGroupBys.contains(true)) {
      if (tableColumns.exists(col => col.isHorizontalView)) {
        // group1 value1 value2 formatter_value value1 value2 formatter_value (multi group and horizontal table)
        val lastGroupIndex: Int = isGroupBys.lastIndexOf(true)
        fillFormatterKeys(0, lastGroupIndex, aggFnCount + 1, formatterCols) ++
          fillFormatterKeys(1, colCount - lastGroupIndex, aggFnCount, formatterCols)
      } else {
        // group1 value1 value2 formatter_value group2 value1 value2 formatter_value (tabular table)
        fillFormatterKeys(0, colCount, aggFnCount + 1, formatterCols)
      }
    } else {
      if (tableColumns.exists(col => col.isHorizontalView)) {
        // agg1 agg2 formatter_col agg1 agg2 formatter_col
        fillFormatterKeys(0, colCount, aggFnCount, formatterCols)
      } else {
        tableColumns.map(c => if (c.formatterKey.isDefined) c.formatterKey.get else "")
      }
    }
  }

  private def fillFormatterKeys(
      startIndex: Int,
      length: Int,
      step: Int,
      formatterCols: Array[TableColumn]
  ): Array[String] = {
    // [group, sum, count, formatter_sum, formatter_count] ~ 1 group col, n agg cols (m, n-m formatter cols)
    val formatterKeys = Array.fill(length)("")
    val formatterCount: Int = formatterCols.length
    val nonFormatterCol: Int = step - formatterCount
    var index = startIndex
    while (index < length && step > 0) {
      for (i <- 0 until formatterCount if index + i < length) {
        formatterKeys(index + nonFormatterCol + i) = formatterCols(i).formatterKey.getOrElse("")
      }
      index += step
    }
    formatterKeys
  }

  private def getCurGroupKey(curIndex: Int, isGroupCols: Array[Boolean], row: Array[Object]): String = {
    val groupIndexes = isGroupCols.zipWithIndex
      .filter {
        case (isGroupCol, i) => isGroupCol && (i <= curIndex)
      }
      .map(p => p._2)
    row.zipWithIndex
      .filter {
        case (_, i) => groupIndexes.contains(i)
      }
      .map(p => p._1)
      .mkString(".")
  }

  /**
    * object query format: GroupBy GroupBy Agg
    * auto add Order by Agg acs/desc limit 1
    * return Tuple2(min, max)
    */
  private def queryMinMaxValues(
      orgId: Long,
      groups: Seq[Function],
      valueCol: TableColumn,
      objQuery: ObjectQuery
  ): Future[MinMaxPair] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::queryMinMaxValues") {
      // TODO: query by select min,max
      for {
        minQuery: String <- queryExecutor.parseQuery(
          orgId,
          objQuery.copy(
            functions = groups :+ valueCol.function,
            orders = Array(OrderBy(valueCol.function, Order.ASC, Some(1)))
          )
        )
        maxQuery: String <- queryExecutor.parseQuery(
          orgId,
          objQuery.copy(
            functions = groups :+ valueCol.function,
            orders = Array(OrderBy(valueCol.function, Order.DESC, Some(1)))
          )
        )
        minMaxSql: String = s"($minQuery) UNION ALL ($maxQuery)"
        baseMinMaxResp <- queryExecutor.execute(orgId, minMaxSql)
      } yield {
        if (baseMinMaxResp.records.nonEmpty) {
          baseMinMaxResp.records.transpose.last match {
            case Array(a, b) =>
              val firstNum: Double = Try(a.toString.toDouble).getOrElse(0)
              val secondNum: Double = Try(b.toString.toDouble).getOrElse(0)
              MinMaxPair(valueCol.name, firstNum.min(secondNum), firstNum.max(secondNum))
          }
        } else {
          MinMaxPair(valueCol.name, 0, 0)
        }
      }
    }

  private def isGroupedQuery(objQuery: ObjectQuery): Boolean = {
    objQuery.functions.exists(_.isGroupByFunc)
  }

  private def applyLimit(query: Query, limit: Option[Limit]): Query = {
    query match {
      case q: SqlQuery =>
        val sql: String = q.query
        val limitClause = ClickhouseParser.findFirstMatch(sql, SqlRegex.LimitRegex)
        limitClause match {
          case Some(_) => q
          case None =>
            limit match {
              case Some(x) =>
                val sql = ClickhouseParser.addLimit(q.query, x)
                SqlQuery(sql)
              case None => q
            }
        }

      case objQuery: ObjectQuery =>
        objQuery.copy(limit = limit)

      case _ => query
    }
  }

  // return 2 baseTableResponse, the first one is for original query, the second one for compare results
  // if result can not be compare, the second array is empty
  private def executeCompareQueries(
      orgId: Long,
      query: Query,
      querySetting: ChartSetting,
      compareRequest: CompareRequest
  ): Future[(DataTable, DataTable)] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::executeCompareQueries") {
      if (!querySetting.toTableColumns.exists(_.function.isAggregateFunc)) {
        throw BadRequestError("comparison request has to have at least one aggregation function")
      }

      val firstQuery = query.addConditions(compareRequest.firstCondition.toSeq)
      val secondQuery = query.addConditions(compareRequest.secondCondition.toSeq).setLimit(None)

      for {
        firstResp <- executeQuery(orgId, firstQuery, querySetting.toTableColumns)
        secondResp <- executeQuery(orgId, secondQuery, querySetting.toTableColumns)
      } yield {
        val isGroupCols = firstResp.isGroupCols
        val rowIndexesMap = buildRowIndexesMap(secondResp.records, isGroupCols)
        val colIndexesMap = buildColIndexesMap(secondResp.headers)

        val compareRecords = ArrayBuffer.empty[Array[Object]]
        firstResp.records.foreach(row => {
          val key = getGroupFieldsKey(row, isGroupCols)
          if (rowIndexesMap.isDefinedAt(key)) {
            val compareRow = ArrayBuffer.empty[Object]
            val rowIndex = rowIndexesMap(key)
            row.zipWithIndex.foreach {
              case (v, i) =>
                if (isGroupCols(i)) {
                  compareRow += v
                } else {
                  val colKey = firstResp.headers(i)
                  if (colIndexesMap.isDefinedAt(colKey)) {
                    val colIndex = colIndexesMap(colKey)
                    compareRow += secondResp.records(rowIndex)(colIndex)
                  } else {
                    compareRow += null
                  }
                }
            }
            compareRecords += compareRow.toArray
          } else {
            val compareRow = ArrayBuffer.empty[Object]
            row.zipWithIndex.foreach {
              case (v, i) =>
                if (isGroupCols(i)) compareRow += v
                else compareRow += null
            }
            compareRecords += compareRow.toArray
          }
        })
        val compareResp = firstResp.copy(records = compareRecords.toArray)
        Tuple2(firstResp, compareResp)
      }
    }

  private def buildRowIndexesMap(
      records: Array[Array[Object]],
      isGroupCols: Array[Boolean]
  ): HashMap[String, Int] = {
    val indexMap = mutable.HashMap.empty[String, Int]
    records.zipWithIndex.foreach {
      case (row, i) =>
        val key = getGroupFieldsKey(row, isGroupCols)
        indexMap(key) = i
    }
    HashMap(indexMap.toSeq: _*)
  }

  private def buildColIndexesMap(headers: Array[String]): HashMap[String, Int] = {
    val indexMap = mutable.HashMap.empty[String, Int]
    headers.zipWithIndex.foreach {
      case (header, i) => indexMap.put(header, i)
    }
    HashMap(indexMap.toSeq: _*)
  }

  private def getGroupFieldsKey(row: Array[Object], isGroupCols: Array[Boolean]): String = {
    val groupItems = row.zip(isGroupCols).filter(p => p._2).map(p => p._1)
    groupItems.mkString(".")
  }

  private def computeValuesDiff(
      firstResponse: DataTable,
      secondResponse: DataTable
  ): DataTable = {
    val colTypes = firstResponse.colTypes
    val diffValues = ArrayBuffer.empty[Array[Object]]
    firstResponse.records.zip(secondResponse.records).foreach {
      case (rowFirst, rowSecond) =>
        val row = ArrayBuffer.empty[Object]
        for (i <- rowFirst.indices) {
          if (isNumCol(colTypes(i))) row += calcDiff(rowFirst(i), rowSecond(i))
          else row += rowFirst(i)
        }
        diffValues += row.toArray
    }
    firstResponse.copy(records = diffValues.toArray)
  }

  private def computePercentageDiff(
      firstResponse: DataTable,
      secondResponse: DataTable
  ): DataTable = {
    val colTypes = firstResponse.colTypes
    val percentageDiff = ArrayBuffer.empty[Array[Object]]
    firstResponse.records.zip(secondResponse.records).foreach {
      case (rowFirst, rowSecond) =>
        val row = ArrayBuffer.empty[Object]
        for (i <- rowFirst.indices) {
          if (isNumCol(colTypes(i))) row += calcPercentageDiff(rowFirst(i), rowSecond(i))
          else row += rowFirst(i)
        }
        percentageDiff += row.toArray
    }
    firstResponse.copy(records = percentageDiff.toArray)
  }

  private def calcDiff(base: Object, target: Object): Object = {
    if (base == null || target == null) return null
    val first = base.toString.toDouble
    val second = target.toString.toDouble
    val res = first - second
    res.asInstanceOf[Object]
  }

  private def calcPercentageDiff(base: Object, target: Object): Object = {
    if (base == null || target == null) return null
    val first = base.toString.toDouble
    val second = target.toString.toDouble
    val res = (first - second) / second * 100
    DoubleFormatter.format(res.asInstanceOf[Object])
  }

  private def applyDecryption(query: Query, username: Option[String]): Query = {
    val defaultUser = ZConfig.getString("api_key_resolver.username")

    if (username.isEmpty || username.get != defaultUser) {
      return query
    }

    val encryptKey = ZConfig.getString("database.clickhouse.encryption.key")
    query match {
      case sqlQuery: SqlQuery    => sqlQuery.copy(encryptKey = Some(encryptKey))
      case objQuery: ObjectQuery => objQuery.copy(encryptKey = Some(encryptKey))
    }
  }

  private def fetchRelationships(orgId: Option[Long], dashboardId: Option[Long]): Future[RelationshipInfo] = {
    if (orgId.isDefined && dashboardId.isDefined) {
      relationshipService.get(orgId.get, dashboardId.get)
    } else {
      Future(RelationshipInfo(Seq.empty, Seq.empty))
    }
  }

  private def fetchRlsPolicies(orgId: Option[Long], userProfile: Option[UserProfile]): Future[Seq[RlsPolicy]] = {
    if (orgId.isDefined && userProfile.isDefined) {
      rlsPolicyService
        .list(orgId.get, None, None)
        .map(_.data)
        .map(policies => {
          policies.filter(policy => policy.conditions.nonEmpty && isAffectedUser(policy, userProfile.get))
        })
    } else {
      Future(Seq.empty)
    }
  }

  private def isAffectedUser(policy: RlsPolicy, userProfile: UserProfile): Boolean = {
    if (policy.userIds.contains(userProfile.username)) {
      return true
    }

    if (policy.userAttribute.isDefined) {
      isAffectedByPolicy(userProfile, policy.userAttribute.get)
    } else false
  }

  private def isAffectedByPolicy(userProfile: UserProfile, requiredAttribute: UserAttribute): Boolean = {
    val userProperties: Map[String, String] = userProfile.properties.getOrElse(Map.empty)

    requiredAttribute.operator match {
      case AttributeBasedOperator.IsNull =>
        val key: String = requiredAttribute.key
        userProperties.isEmpty || !userProperties.contains(key)

      case AttributeBasedOperator.IsNotNull =>
        val key: String = requiredAttribute.key
        userProperties.isDefinedAt(key)

      case AttributeBasedOperator.Equal =>
        val key: String = requiredAttribute.key

        require(requiredAttribute.values.nonEmpty, "RLS with Equal operator requires at least 1 value")
        val value: String = requiredAttribute.values.head
        userProperties.contains(key) && userProperties(key) == value

      case AttributeBasedOperator.NotEqual =>
        val key: String = requiredAttribute.key

        require(requiredAttribute.values.nonEmpty, "RLS with NotEqual operator requires at least 1 value")
        val value: String = requiredAttribute.values.head
        !userProperties.contains(key) || userProperties(key) != value

      case AttributeBasedOperator.Contain =>
        val key: String = requiredAttribute.key
        val values: Seq[String] = requiredAttribute.values
        userProperties.contains(key) && values.contains(userProperties(key))

      case AttributeBasedOperator.NotContain =>
        val key: String = requiredAttribute.key
        val values: Seq[String] = requiredAttribute.values
        !userProperties.contains(key) || !values.contains(userProperties(key))

      case _ =>
        error(
          s"${this.getClass.getSimpleName}::isUserAttributeConformPolicy operator not found: ${requiredAttribute.operator}"
        )
        false
    }
  }

  private def prepareQuery(
      request: ChartRequest,
      limit: Option[Limit],
      viewAsProfile: Option[UserProfile]
  ): Future[PrepareQueryResponse] = {
    val orgId: Option[Long] = Try(request.currentOrganizationId.get).toOption
    val userProfile: Option[UserProfile] = if (viewAsProfile.isDefined) {
      viewAsProfile
    } else Try(request.currentProfile).toOption.flatten
    val baseQuery: Query = request.querySetting.toQuery

    for {
      relationshipInfo <- fetchRelationships(orgId, request.dashboardId)
      rlsPolicies <- fetchRlsPolicies(orgId, userProfile)
      tableExpressions <- fetchTablesExpression(baseQuery.allQueryViews)
      finalQuery = enhanceQuery(
        baseQuery = baseQuery,
        username = userProfile.map(_.username),
        limit = limit,
        filterRequests = if (request.querySetting.isInstanceOf[FilterSetting]) Array.empty else request.filterRequests,
        relationshipInfo = relationshipInfo,
        rlsPolicies = rlsPolicies,
        expressions = tableExpressions,
        parameters = request.parameters
      )
    } yield {
      PrepareQueryResponse(relationshipInfo, rlsPolicies, tableExpressions, finalQuery)
    }
  }

  private def optimizeConditions(
      conditions: Seq[Condition],
      joinConditions: Seq[JoinCondition]
  ): (Seq[Condition], Seq[JoinCondition]) = {
    val excludedConditions = ArrayBuffer[Condition]()
    val finalJoinConditions = ArrayBuffer[JoinCondition]()

    joinConditions.foreach(joinCondition => {
      val leftViewConditions = conditions.filter(condition => isCondRelatedToView(condition, joinCondition.leftView))
      val finalLeftView: QueryView =
        if (leftViewConditions.nonEmpty) {
          excludedConditions ++= leftViewConditions
          SqlView(
            aliasName = joinCondition.leftView.aliasName,
            query = ObjectQuery(functions = Seq(SelectAll()), conditions = leftViewConditions)
          )
        } else joinCondition.leftView

      val rightViewConditions = conditions.filter(condition => isCondRelatedToView(condition, joinCondition.rightView))
      val finalRightView: QueryView =
        if (rightViewConditions.nonEmpty) {
          excludedConditions ++= rightViewConditions
          SqlView(
            aliasName = joinCondition.rightView.aliasName,
            query = ObjectQuery(functions = Seq(SelectAll()), conditions = rightViewConditions)
          )
        } else joinCondition.rightView

      finalJoinConditions += joinCondition.customCustom(leftView = finalLeftView, rightView = finalRightView)
    })

    val finalConditions: Seq[Condition] = conditions.filterNot(c => excludedConditions.contains(c))

    (finalConditions, finalJoinConditions)
  }

  private def isCondRelatedToView(condition: Condition, queryView: QueryView): Boolean = {
    if (!queryView.isInstanceOf[TableView]) {
      return false
    }
    val tableView = queryView.asInstanceOf[TableView]

    if (!condition.isInstanceOf[FieldRelatedCondition]) {
      return false
    }
    val fieldRelatedCondition = condition.asInstanceOf[FieldRelatedCondition]

    if (!fieldRelatedCondition.field.isInstanceOf[TableField]) {
      return false
    }
    val conditionField = fieldRelatedCondition.field.asInstanceOf[TableField]

    tableView.dbName == conditionField.dbName && tableView.tblName == conditionField.tblName
  }

}
