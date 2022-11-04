package co.datainsider.bi.service

import co.datainsider.bi.domain.CompareMode.{CompareMode, PercentageDiff, RawValues, ValuesDiff}
import co.datainsider.bi.domain.Ids.Geocode
import co.datainsider.bi.domain.{
  AttributeBasedOperator,
  Order,
  QueryContext,
  Relationship,
  RelationshipGraph,
  RelationshipInfo,
  RlsPolicy,
  SqlRegex,
  UserAttribute
}
import co.datainsider.bi.domain.chart._
import co.datainsider.bi.domain.query._
import co.datainsider.bi.domain.request.{ChartRequest, CompareRequest, FilterRequest, SqlQueryRequest, ViewAsRequest}
import co.datainsider.bi.domain.response._
import co.datainsider.bi.engine.clickhouse.{ClickhouseParser, DataTable}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.Implicits.ImplicitObject
import co.datainsider.bi.util.StringUtils.{findClosestString, normalizeVietnamese}
import co.datainsider.bi.util._
import datainsider.profiler.Profiler
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.{ArrayNode, ObjectNode}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.user.UserProfile
import datainsider.client.exception.BadRequestError
import datainsider.client.service.SchemaClientService
import datainsider.client.util.JsonParser.mapper
import datainsider.client.util.ZConfig

import scala.collection.immutable.HashMap
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

trait QueryService {
  def query(request: ChartRequest): Future[ChartResponse]

  def query(request: SqlQueryRequest): Future[SqlQueryResponse]

  def query(request: ViewAsRequest): Future[ChartResponse]
}

class QueryServiceImpl @Inject() (
    parser: QueryParser,
    engine: Engine[DataTable],
    queryExecutor: QueryExecutor,
    geolocationService: GeolocationService,
    relationshipService: RelationshipService,
    rlsPolicyService: RlsPolicyService,
    schemaClientService: SchemaClientService
) extends QueryService
    with Logging {

  private def executeQuery(query: Query, tableCols: Array[TableColumn]): DataTable =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::executeQuery") {
      queryExecutor.executeQuery(query, tableCols)
    }

  override def query(request: SqlQueryRequest): Future[SqlQueryResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::SqlQueryRequest") {
      Future {
        val username: Option[String] = Try(request.currentUsername).toOption
        val query: Query = applyDecryption(request.toQuery, username)
        val dataObject: DataTable =
          queryExecutor.executeQuery(query, request.toTableColumns, formatValues = false)
        SqlQueryResponse(headers = dataObject.headers, records = dataObject.records)
      }
    }

  override def query(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::ChartRequest") {
      val orgId: Option[Long] = Try(request.currentOrganizationId.get).toOption
      val userProfile: Option[UserProfile] = Try(request.currentProfile).toOption.flatten

      buildQueryAndExecute(orgId, userProfile, request)
    }

  override def query(request: ViewAsRequest): Future[ChartResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::queryWith") {
      require(request.userProfile.isDefined, "an user profile is required for querying as ViewAs")
      val orgId: Option[Long] = Try(request.currentOrganizationId.get).toOption

      buildQueryAndExecute(orgId, request.userProfile, request.queryRequest)
    }

  private def buildQueryAndExecute(
      orgId: Option[Long],
      userProfile: Option[UserProfile],
      request: ChartRequest
  ): Future[ChartResponse] = {
    val limit: Option[Limit] = processLimit(request)
    val baseQuery: Query = request.querySetting.toQuery

    for {
      relationshipInfo <- fetchRelationships(orgId, request.dashboardId)
      rlsPolicies <- fetchRlsPolicies(orgId, userProfile)
      tableExpressions <- fetchTablesExpression(baseQuery.allQueryViews)
      finalQuery = enhanceQuery(
        baseQuery,
        userProfile.map(_.username),
        limit,
        if (request.querySetting.isInstanceOf[FilterSetting]) Array.empty else request.filterRequests,
        relationshipInfo,
        rlsPolicies,
        Some(QueryContext(tableExpressions))
      )
      chartResp <- executeAndRenderChart(
        finalQuery,
        request,
        request.filterRequests,
        relationshipInfo,
        rlsPolicies,
        Some(QueryContext(tableExpressions))
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
      externalContext: Option[QueryContext]
  ): Query = {
    val enhancedQuery = processAdditionalConditions(baseQuery, filterRequests, relationshipInfo)
    val decryptQuery = applyDecryption(enhancedQuery, username)
    val finalQuery = applyLimit(decryptQuery, limit).customCopy(rlsPolicies.map(_.toRlsCondition()))

    finalQuery.customCopy(externalContext)
  }

  private def executeAndRenderChart(
      query: Query,
      request: ChartRequest,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      externalContext: Option[QueryContext]
  ): Future[ChartResponse] = {
    request.querySetting match {
      case s: PieChartSetting =>
        toPieLikeResponse(query, s)
      case s: FunnelChartSetting =>
        toPieLikeResponse(query, s)
      case s: PyramidChartSetting =>
        toPieLikeResponse(query, s)
      case s: SeriesChartSetting =>
        toSeriesResponse(query, s, request.compareRequest)
      case s: ScatterChartSetting =>
        toScatterResponse(query, s)
      case s: BubbleChartSetting =>
        toBubbleResponse(query, s)
      case s: HeatMapChartSetting =>
        toHeatMapResponse(query, s)
      case s: TableChartSetting =>
        toTableResponse(query, s)
      case s: GroupTableChartSetting =>
        toGroupTableResponse(query, s)
      case s: NumberChartSetting =>
        toNumberResponse(query, s, request.compareRequest)
      case s: GaugeChartSetting =>
        toGaugeResponse(query, s, request.compareRequest)
      case s: DrilldownChartSetting =>
        toDrilldownResponse(query, s)
      case s: TreeMapChartSetting =>
        toTreeMapResponse(query, s)
      case s: WordCloudChartSetting =>
        toWordCloudResponse(query, s)
      case s: HistogramChartSetting =>
        toHistogramResponse(query, s)
      case s: DropdownFilterChartSetting =>
        toDropdownFilterResponse(query, s)
      case s: TabFilterChartSetting =>
        toDropdownFilterResponse(query, s)
      case s: TabControlChartSetting =>
        toDropdownFilterResponse(query, s)
      case s: InputControlChartSetting =>
        toDropdownFilterResponse(query, s)
      case s: MapChartSetting =>
        toMapResponse(query, s)
      case s: PivotTableSetting =>
        toPivotTableResponse(query, s, filterRequests, relationshipInfo, rlsPolicies, externalContext)
      case s: FlattenPivotTableSetting =>
        toTableResponse(query, s)
      case s: RawQuerySetting =>
        toRawQueryResponse(query, s)
      case s: DonutChartSetting =>
        toPieLikeResponse(query, s)
      case s: ParliamentChartSetting =>
        toPieLikeResponse(query, s)
      case s: SpiderWebChartSetting =>
        toSpiderWebResponse(query, s)
      case s: BellCurveChartSetting =>
        toBellCurveResponse(query, s)
      case s: SankeyChartSetting =>
        toSankeyResponse(s)
      case _ => throw BadRequestError(s"response for setting ${request.querySetting} is not yet supported")
    }
  }

  private def fetchTablesExpression(views: Seq[QueryView]): Future[Map[String, String]] = {
    val viewsFromSql: Seq[QueryView] =
      views.filter(_.isInstanceOf[SqlView]).map(_.asInstanceOf[SqlView]).flatMap(sqlView => sqlView.query.allQueryViews)

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
              val relationships = relationshipGraph.findPath(startView, filterView)

              if (relationships.nonEmpty) {
                addedJoinConditions ++= getJoinConditions(relationships)
                addedConditions += filter.condition
              } // TODO: add info of affected filter (by filterId)

            }
          })

        objQuery.copy(
          conditions = objQuery.conditions ++ addedConditions.distinct,
          joinConditions = (objQuery.joinConditions ++ addedJoinConditions).distinct
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
      query: Query,
      setting: ChartSetting
  ): Future[SeriesTwoResponse] =
    Future {
      Profiler(s"[Builder] ${this.getClass.getSimpleName}::toPieLikeResponse") {
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
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
      }
    }

  private def toSeriesResponse(
      query: Query,
      seriesSetting: SeriesChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] =
    Future {
      Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSeriesResponse") {
        val invalidColumns = seriesSetting.yAxis.filter(tableColumn =>
          tableColumn.function.isInstanceOf[GroupBy] || tableColumn.function.isInstanceOf[Select]
        )
        if (invalidColumns.nonEmpty)
          throw BadRequestError("Y axis not support group by and none, please config chart again")
        compareRequest match {
          case Some(r) =>
            val (firstResponse, secondResponse) =
              executeCompareQueries(query, seriesSetting, r)
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

          case None =>
            val baseTable = executeQuery(query, seriesSetting.toTableColumns)
            renderSeriesResponse(baseTable, seriesSetting)
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
        val xAxis = recordsTransposed(0) // [a,b,c,d]
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
        val xAxis = recordsTransposed(0)
        SeriesOneResponse(series.toArray, xAxis = Some(xAxis))
      }
    }

  private def toBellCurveResponse(query: Query, setting: BellCurveChartSetting): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toBellCurveResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
        if (baseTable.headers.isEmpty && isNumCol(baseTable.colTypes(0)))
          throw BadRequestError("Current config is not compatible with bell curve chart")

        val name: String = baseTable.headers(0)
        val data: Array[Object] = baseTable.records.map(r => r(0))
        SeriesOneResponse(series = Array(SeriesOneItem(name, data)))
      }
    }

  private def toScatterResponse(query: Query, setting: ScatterChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toScatterResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
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
      }
    }

  private def toBubbleResponse(query: Query, setting: BubbleChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toBubbleResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
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

            records.groupBy(r => r(0)).foreach {
              case (key, row) => series += SeriesTwoItem(key.toString, row.map(r => Array(r(1), r(2), r(3))))
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
      }
    }

  private def toHeatMapResponse(query: Query, setting: HeatMapChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toHeatMapResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
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
      }
    }

  private def toTableResponse(query: Query, setting: ChartSetting): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toTableResponse") {
      Future {
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
        val total: Long = getTotal(query)
        val minMaxPairs: Array[MinMaxPair] = getMinMaxPairs(query, setting.toTableColumns)
        val (headers, records) = renderJsonTabularResponse(baseTable)
        JsonTableResponse(
          headers,
          records,
          total,
          minMaxPairs
        )
      }
    }

  private def getTotal(query: Query): Long =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotal") {
      query match {
        case objQuery: ObjectQuery => getTotalOfObjQuery(objQuery)
        case sqlQuery: SqlQuery    => getTotalOfSqlQuery(sqlQuery)
      }
    }

  private def getMinMaxPairs(query: Query, tableCols: Array[TableColumn]): Array[MinMaxPair] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getMinMaxPairs") {
      query match {
        case objQuery: ObjectQuery =>
          val calcMinMaxCols: Array[TableColumn] = tableCols.filter(c => c.isCalcMinMax)
          val otherCols: Array[TableColumn] = tableCols.filterNot(c => c.isCalcMinMax)
          calcMinMaxCols.map(col => queryMinMaxValues(otherCols.map(_.function), col, objQuery))
        case _ => throw BadRequestError(s"get total rows num of query $query is not supported")
      }
    }

  private def toGroupTableResponse(query: Query, setting: GroupTableChartSetting): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toGroupTableResponse") {
      Future {
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
        val (headers, records) = renderJsonPivotResponse(baseTable, setting.toTableColumns)

        val total: Long = getTotal(query)
        val minMaxPairs: Array[MinMaxPair] = getMinMaxPairs(query, setting.toTableColumns)

        JsonTableResponse(
          headers,
          records,
          total,
          minMaxPairs
        )
      }
    }

  private def getTotalOfObjQuery(objQuery: ObjectQuery): Long =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotalOfObjQuery") {
      val firstColumnObjQuery: Query = toFirstColumnObjQuery(objQuery)
      val firstColSql: String = parser.parse(firstColumnObjQuery)
      val countSql: String = ClickhouseParser.toCountSql(firstColSql)
      val df: DataTable = engine.execute(countSql)
      df.records(0)(0).asString.toLong
    }

  /**
    * build special query to find total row for pivot table
    * @param baseObjQuery input query
    * @return query which only contain first function column
    */
  private def toFirstColumnObjQuery(baseObjQuery: ObjectQuery): ObjectQuery = {
    require(baseObjQuery.functions.nonEmpty, "functions can not be empty when build FirstColumnObjQuery")

    val firstFunction: Function = if (isGroupQuery(baseObjQuery)) {
      val groupBys: Array[GroupBy] = filterGroupByFn(baseObjQuery.functions.toArray).map(_.asInstanceOf[GroupBy])
      groupBys.head
    } else {
      baseObjQuery.functions.head
    }
    baseObjQuery.copy(functions = Seq(firstFunction), orders = Seq.empty, limit = None)
  }

  private def getTotalOfSqlQuery(sqlQuery: SqlQuery): Long =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::getTotalOfSqlQuery") {
      val baseQuery = parser.parse(sqlQuery)
      val countSql: String = ClickhouseParser.toCountSql(baseQuery)
      val df: DataTable = engine.execute(countSql)
      df.records(0)(0).asString.toLong
    }

  private def toNumberResponse(
      query: Query,
      setting: ChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toNumberResponse") {
      Future {
        compareRequest match {
          case Some(r) =>
            val (baseResp, compareResp) = executeCompareQueries(query, setting, r)
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

          case None =>
            val baseTable = executeQuery(query, setting.toTableColumns)
            renderNumberResponse(baseTable)
        }
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
      query: Query,
      setting: ChartSetting,
      compareRequest: Option[CompareRequest]
  ): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toGaugeResponse") {
      Future {
        compareRequest match {
          case Some(r) =>
            val (baseResp, compareResp) = executeCompareQueries(query, setting, r)
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

          case None =>
            val baseTable = executeQuery(query, setting.toTableColumns)
            renderGaugeResponse(baseTable)
        }
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

  private def toDrilldownResponse(query: Query, setting: DrilldownChartSetting): Future[DrilldownResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDrilldownResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
        val isGroupBys = baseTable.isGroupCols
        val name = setting.legends(0).name
        val series: Array[DrilldownValue] = toDrilldownSeries(baseTable.records, isGroupBys)
        val drilldown: Array[DrilldownItem] = toDrilldownDetails(baseTable.records, isGroupBys)
        DrilldownResponse(name, series, drilldown)
      }
    }

  private def toTreeMapResponse(query: Query, setting: TreeMapChartSetting): Future[TreeMapResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toTreeMapResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
        val isGroupBys = baseTable.isGroupCols
        val (data, groups) = toTreeMapData(baseTable.records, isGroupBys)
        val name = setting.legends(0).name
        TreeMapResponse(name, data, groups)
      }
    }

  private def toWordCloudResponse(query: Query, setting: WordCloudChartSetting): Future[WordCloudResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toWordCloudResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
        if (isResultTblValidForWordCloudChart(baseTable.colTypes))
          renderWordCloudResponse(baseTable.records)
        else throw BadRequestError("Current config is not compatible with word cloud chart")
      }
    }

  // TODO: sankey not support build multiple breakdown layer yet, currently only use first item in breakdown list
  private def toSankeyResponse(setting: SankeyChartSetting): Future[SeriesTwoResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSankeyResponse") {
      Future {
        var sankeyRecords = Array.empty[Array[Object]]
        if (setting.breakdowns.nonEmpty) {
          val firstHalfQuery = setting.buildSankeyQuery(setting.source, setting.breakdowns(0))
          val secondHalfQuery = setting.buildSankeyQuery(setting.breakdowns(0), setting.destination)

          val firstBaseTable = executeQuery(firstHalfQuery, setting.toTableColumns)
          val secondBaseTable = executeQuery(secondHalfQuery, setting.toTableColumns)

          sankeyRecords = normalizeSankeyData(firstBaseTable.records) ++ normalizeSankeyData(secondBaseTable.records)

        } else {
          val query = setting.buildSankeyQuery(setting.source, setting.destination)
          val baseTable = executeQuery(query, setting.toTableColumns)
          sankeyRecords = normalizeSankeyData(baseTable.records)
        }

        SeriesTwoResponse(Array(SeriesTwoItem(name = "", data = sankeyRecords)))
      }
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

  private def toHistogramResponse(query: Query, setting: HistogramChartSetting): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toHistogramResponse") {
      Future {
        val baseSql: String = parser.parse(query)
        val histogramSql: String =
          toHistogramSql(baseSql, setting.value.function.asInstanceOf[FieldRelatedFunction], setting.binsNumber)
        val resultTbl = engine.executeHistogramQuery(histogramSql)
        renderHistogramResponse(resultTbl, setting.value.name)
      }
    }

  private def toDropdownFilterResponse(query: Query, setting: ChartSetting): Future[VizTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toDropdownFilterResponse") {
      Future {
        val baseTable = executeQuery(query, setting.toTableColumns)
        val headers = Array("label", "value")
        val records = baseTable.records
        val total: Long = getTotal(query)
        VizTableResponse(headers, records, total)
      }
    }

  /**
    * geolocation code in conduct from user-mapped code and auto-detect code using normalize name
    * user-mapped code is define in setting
    * auto detect code is string processing algo:
    * - remove special chars
    * - multi word string is concat by underscore
    */
  private def toMapResponse(query: Query, setting: MapChartSetting): Future[MapResponse] = {
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toMapResponse") {
      val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
      val colTypes: Array[String] = baseTable.colTypes
      if (colTypes.slice(1, colTypes.length).exists(c => !isNumCol(c)))
        throw BadRequestError("Current configuration is not compatible with map chart")

      val usersMapping: Map[String, Geocode] = Serializer.fromJson[Map[String, Geocode]](setting.normalizedNameMap)
      for {
        locations <- geolocationService.list(setting.geoArea)
      } yield {
        val normalizedNamesMapping: Map[String, Geocode] = locations.map(loc => (loc.normalizedName, loc.code)).toMap
        val locationNames: Seq[String] = locations.map(_.normalizedName)
        val locData: Array[MapItem] = baseTable.records.map(row => {
          val code: Geocode = detectGeocode(row(0).asString, locationNames, normalizedNamesMapping, usersMapping)
          MapItem(code, row(0).asString, row(1))
        })
        val knownLocations: Array[Geocode] = locData.map(_.code)
        val unknownLocData: Array[MapItem] =
          locations.filterNot(loc => knownLocations.contains(loc.code)).map(loc => MapItem(loc.code, loc.name, null))
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

  private def toRawQueryResponse(query: Query, setting: ChartSetting): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toRawQueryResponse") {
      Future {
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
        val (headers, records) = renderJsonTabularResponse(baseTable)
        val total: Long = getTotal(query)

        JsonTableResponse(
          headers,
          records,
          total
        )
      }
    }

  private def toPivotTableResponse(
      query: Query,
      setting: PivotTableSetting,
      filterRequests: Array[FilterRequest],
      relationshipInfo: RelationshipInfo,
      rlsPolicies: Seq[RlsPolicy],
      externalContext: Option[QueryContext]
  ): Future[JsonTableResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toPivotTableResponse") {
      Future {
        val invalidColumns = (setting.rows ++ setting.columns).filterNot(_.function.isInstanceOf[GroupBy])
        if (invalidColumns.nonEmpty)
          throw BadRequestError(
            "Current config is not compatible with pivot table chart, just support group by for columns and rows"
          )
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
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
              externalContext = externalContext
            )

            val grandTotalBaseResp: DataTable = executeQuery(grandTotalQuery, setting.toGrandTotalTableColumns)

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
              externalContext = externalContext
            )

            val horizontalTotalBaseResp: DataTable =
              executeQuery(horizontalTotalQuery, setting.toHorizontalTableColumns)

            renderJsonHeadersForPivotTable(horizontalTotalBaseResp, headers, setting)

          } else {
            headers
          }
        }

        val total: Long = getTotal(query)
        val minMaxPairs: Array[MinMaxPair] = getMinMaxPairs(query, setting.toTableColumns)

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

  private def toSpiderWebResponse(query: Query, setting: SpiderWebChartSetting): Future[SeriesOneResponse] =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::toSpiderWebResponse") {
      Future {
        val baseTable: DataTable = executeQuery(query, setting.toTableColumns)
        val numCols = baseTable.headers.length
        val recordsTransposed = baseTable.records.transpose
        val series = ArrayBuffer.empty[SeriesOneItem]
        if (baseTable.records.nonEmpty) {
          for (i <- 1 until numCols) {
            val name = baseTable.headers(i)
            val data = recordsTransposed(i)
            series += SeriesOneItem(name, data)
          }
          val xAxis = recordsTransposed(0)
          SeriesOneResponse(series.toArray, xAxis = Some(xAxis))
        } else {
          SeriesOneResponse(Array.empty, xAxis = Some(Array.empty))
        }
      }
    }

  private def toHistogramSql(sql: String, targetFunc: FieldRelatedFunction, binNumber: Int): String = {
    val targetField = ClickhouseParser.toAliasName(targetFunc)
    s"select histogram($binNumber)($targetField) from($sql)"
  }

  private def renderHistogramResponse(table: DataTable, valueName: String): SeriesOneResponse =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::renderHistogramResponse") {
      val intervals = table.records.map(r => {
        val lower = PrettyNumberFormatter.format(r(0))
        val upper = PrettyNumberFormatter.format(r(1))
        s"[$lower, $upper]".asInstanceOf[Object]
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
    val patterns = Array("int", "float", "double")
    patterns.exists(pattern => colType.toLowerCase.contains(pattern))
  }

  private def renderJsonTabularResponse(
      resultTbl: DataTable
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
            if (formatterKeys.nonEmpty && formatterKeys(i).nonEmpty) item.put("formatter_key", formatterKeys(i))

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
    val aggFnCount: Int = filterAggregateFn(tableColumns.map(_.function)).length
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
      groups: Seq[Function],
      valueCol: TableColumn,
      objQuery: ObjectQuery
  ): MinMaxPair =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::queryMinMaxValues") {
      // TODO: query by select min,max
      val minQuery: String = parser.parse(
        objQuery.copy(
          functions = groups :+ valueCol.function,
          orders = Array(OrderBy(valueCol.function, Order.ASC, Some(1)))
        )
      )

      val maxQuery: String = parser.parse(
        objQuery.copy(
          functions = groups :+ valueCol.function,
          orders = Array(OrderBy(valueCol.function, Order.DESC, Some(1)))
        )
      )

      val minMaxSql: String = s"$minQuery UNION ALL $maxQuery"
      val baseMinMaxResp: DataTable = engine.execute(minMaxSql)
      if (baseMinMaxResp.records.nonEmpty) {
        baseMinMaxResp.records.transpose.last match {
          case Array(a, b) =>
            val firstNum = a.toString.toDouble
            val secondNum = b.toString.toDouble
            MinMaxPair(valueCol.name, firstNum.min(secondNum), firstNum.max(secondNum))
        }
      } else {
        MinMaxPair(valueCol.name, 0, 0)
      }
    }

  private def isGroupQuery(objQuery: ObjectQuery): Boolean = {
    objQuery.functions.exists {
      case _: GroupBy => true
      case _          => false
    }
  }

  private def filterGroupByFn(functions: Array[Function]): Array[Function] = {
    functions.filter {
      case _: GroupBy => true
      case _          => false
    }
  }

  private def isAggregateFunction(func: Function): Boolean = {
    func match {
      case _: Min | _: Max | _: Sum | _: Count | _: CountDistinct | _: Avg | _: First | _: Last | _: CountAll |
          _: SelectExpr | _: SelectExpression =>
        true
      case _ => false
    }
  }

  private def filterAggregateFn(functions: Array[Function]): Array[Function] = {
    functions.filter(f => isAggregateFunction(f))
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
      query: Query,
      querySetting: ChartSetting,
      compareRequest: CompareRequest
  ): (DataTable, DataTable) =
    Profiler(s"[Builder] ${this.getClass.getSimpleName}::executeCompareQueries") {
      val firstQuery = query.addConditions(compareRequest.firstCondition.toSeq)
      val firstResp = executeQuery(firstQuery, querySetting.toTableColumns)

      val tableCols = querySetting.toTableColumns
      if (tableCols.exists(c => isAggregateFunction(c.function))) {
        val secondQuery = query.addConditions(compareRequest.secondCondition.toSeq).setLimit(None)
        val secondResponse = executeQuery(secondQuery, querySetting.toTableColumns)

        val isGroupCols = firstResp.isGroupCols
        val rowIndexesMap = buildRowIndexesMap(secondResponse.records, isGroupCols)
        val colIndexesMap = buildColIndexesMap(secondResponse.headers)

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
                    compareRow += secondResponse.records(rowIndex)(colIndex)
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
      } else {
        throw BadRequestError("comparison request has to have at least one aggregation function")
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
          policies.filter(policy => policy.conditions.nonEmpty && isTargetedToUser(policy, userProfile.get))
        })
    } else {
      Future(Seq.empty)
    }
  }

  private def isTargetedToUser(policy: RlsPolicy, userProfile: UserProfile): Boolean = {
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

      case AttributeBasedOperator.Equal =>
        val key: String = requiredAttribute.key

        require(requiredAttribute.values.nonEmpty, "RLS with Equal operator requires at least 1 value")
        val value: String = requiredAttribute.values.head
        userProperties.contains(key) && userProperties(key) == value

      case AttributeBasedOperator.Contain =>
        val key: String = requiredAttribute.key
        val values: Seq[String] = requiredAttribute.values
        userProperties.contains(key) && values.contains(userProperties(key))

      case _ =>
        error(
          s"${this.getClass.getSimpleName}::isUserAttributeConformPolicy operator not found: ${requiredAttribute.operator}"
        )
        false
    }
  }

}
