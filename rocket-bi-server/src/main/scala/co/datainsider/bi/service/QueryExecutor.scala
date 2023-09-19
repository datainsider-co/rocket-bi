package co.datainsider.bi.service

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.Implicits.{ImplicitObject, NULL_VALUE}
import co.datainsider.bi.util._
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, async}
import datainsider.client.exception.{BadRequestError, InternalError}

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

trait QueryExecutor {

  /**
    * handle query query object to data table and transform to pivot data table if needed
    * @param query query to be executed
    * @param tableCols setting of query
    * @return
    */
  def executeQuery(
      orgId: Long,
      query: Query,
      tableCols: Array[TableColumn],
      formatValues: Boolean = true
  ): Future[DataTable]

  def parseQuery(orgId: Long, query: Query, useAliasName: Boolean = true): Future[String]

  def execute(orgId: Long, query: String, formatValues: Boolean = true): Future[DataTable]

  def executeHistogramQuery(orgId: Long, field: Function, baseQuery: Query, numBins: Int): Future[DataTable]

  def exportToFile(orgId: Long, query: Query, fileType: FileType): Future[String]

}

final class QueryExecutorImpl @Inject() (
    connectionService: ConnectionService,
    engineResolver: EngineResolver
) extends QueryExecutor
    with Logging {

  override def parseQuery(orgId: Long, query: Query, useAliasName: Boolean): Future[String] = {
    connectionService.getTunnelConnection(orgId).map { source =>
      val engine: Engine[Connection] = engineResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      val queryParser: QueryParser = new QueryParserImpl(engine.getSqlParser())
      queryParser.parse(query, useAliasName)
    }
  }

  override def execute(orgId: Long, query: String, formatValues: Boolean): Future[DataTable] = {
    for {
      source: Connection <- connectionService.getTunnelConnection(orgId)
      engine: Engine[Connection] <- engineResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      result: DataTable <- engine.execute(source, query, formatValues)
    } yield result
  }

  override def executeHistogramQuery(
      orgId: Long,
      function: Function,
      baseQuery: Query,
      numBins: Int
  ): Future[DataTable] = {
    for {
      source: Connection <- connectionService.getTunnelConnection(orgId)
      engine: Engine[Connection] <- engineResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      baseSql <- parseQuery(orgId, baseQuery)
      fieldName = engine.getSqlParser().toAliasName(function)
      histogramSql = engine.getSqlParser().toHistogramSql(fieldName, baseSql, numBins)
      dataTable: DataTable <- engine.executeHistogramQuery(source, histogramSql)
    } yield dataTable
  }

  override def executeQuery(
      orgId: Long,
      query: Query,
      tableCols: Array[TableColumn],
      formatValues: Boolean = true
  ): Future[DataTable] = {
    query match {
      case q: SqlQuery => processSelectQuery(orgId, q, tableCols, formatValues)

      case objQuery: ObjectQuery =>
        try {
          if (isGroupedQuery(objQuery)) {
            processGroupedQuery(orgId, objQuery, tableCols, formatValues)
          } else {
            processSelectQuery(orgId, objQuery, tableCols, formatValues)
          }
        } catch {
          case e: Throwable =>
            throw BadRequestError(s"There is an error when executing this query.", e)
        }

    }

  }

  private def processSelectQuery(
      orgId: Long,
      query: Query,
      tableCols: Array[TableColumn],
      formatValues: Boolean
  ): Future[DataTable] = {
    for {
      sql: String <- parseQuery(orgId, query)
      resultTbl: DataTable <- execute(orgId, sql, formatValues)
    } yield {
      val displayHeaders = if (tableCols.nonEmpty) tableCols.map(c => c.name) else resultTbl.headers
      resultTbl.headers.zipWithIndex.foreach {
        case (_, i) => resultTbl.headers(i) = displayHeaders(i)
      }
      val isGroupCols = Array.fill[Boolean](resultTbl.headers.length)(false)
      resultTbl.copy(isGroupCols = isGroupCols)
    }
  }

  /** *
    *
    * @param objQuery object query to be execute
    * @param tableCols setting of query
    * @return
    */
  private def processGroupedQuery(
      orgId: Long,
      objQuery: ObjectQuery,
      tableCols: Array[TableColumn],
      doFormatValues: Boolean
  ): Future[DataTable] =
    async {
      val groupFunctions: Array[Function] = objQuery.functions.filter(_.isGroupByFunc).toArray
      val aggFunctions: Array[Function] = objQuery.functions.filter(_.isAggregateFunc).toArray
      val orderFunctions: Array[OrderBy] = objQuery.orders.toArray

      val verTotalValuesMap: mutable.HashMap[String, Object] = mutable.HashMap.empty
      var firstGroupElems: Array[String] = Array.empty
      val firstGroupConditions: ArrayBuffer[Condition] = ArrayBuffer.empty

      val isCalcGroupTotals = tableCols.filter(c => c.function.isInstanceOf[GroupBy]).map(_.isCalcGroupTotal)
      var numParentGroups = groupFunctions.length - 1

      val asColFromIndex = findAsColumnIndex(tableCols)
      if (asColFromIndex != -1) numParentGroups = numParentGroups.min(asColFromIndex)

      val flattenFromIndex = findFlattenColIndex(tableCols)
      if (flattenFromIndex != -1) numParentGroups = numParentGroups.min(flattenFromIndex)

      for (i <- 0 until numParentGroups) {
        val curGroups = groupFunctions.slice(0, i + 1)
        val curGroupOrderBy = buildGroupOrderBy(curGroups, orderFunctions, isPriorityAggFn = false)
        if (i == 0) { // always need to calculate first group because query is limit by first group
          val sql = buildObjectQueryWith(
            orgId,
            objQuery,
            curGroups,
            aggFunctions,
            curGroupOrderBy,
            objQuery.conditions,
            objQuery.aggregateConditions,
            objQuery.joinConditions,
            objQuery.limit
          ).syncGet()

          logger.debug(s"renderGroupTblResponse :: first group sql: $sql")
          val response: DataTable = execute(orgId, sql, doFormatValues).syncGet()
          buildVerTotalValuesMap(verTotalValuesMap, response, curGroups, aggFunctions)

          firstGroupElems = response.records.map(r => r(0).asString)
          val firstGroupFunc = groupFunctions(0).asInstanceOf[GroupBy]

          firstGroupConditions += In(
            firstGroupFunc.field,
            firstGroupElems.toSet,
            firstGroupElems.contains(NULL_VALUE),
            firstGroupFunc.scalarFunction
          )
        } else if (isCalcGroupTotals(i)) { // only calc when isCalcGroupTotal is true
          val sql = buildObjectQueryWith(
            orgId,
            objQuery,
            curGroups,
            aggFunctions,
            curGroupOrderBy,
            objQuery.conditions ++ firstGroupConditions,
            objQuery.aggregateConditions,
            objQuery.joinConditions,
            None
          ).syncGet()

          logger.debug(s"renderGroupTblResponse:: next sql: $sql")
          val response: DataTable = execute(orgId, sql, doFormatValues).syncGet()
          buildVerTotalValuesMap(verTotalValuesMap, response, curGroups, aggFunctions)
        }
      }

      val groupOrderBys: Array[OrderBy] = buildGroupOrderBy(groupFunctions, orderFunctions, isPriorityAggFn = false)

      val lastGroupSql: String = buildObjectQueryWith(
        orgId,
        objQuery,
        groupFunctions,
        aggFunctions,
        groupOrderBys,
        objQuery.conditions ++ firstGroupConditions,
        objQuery.aggregateConditions,
        objQuery.joinConditions,
        if (numParentGroups == 0) objQuery.limit else None
      ).syncGet()

      logger.debug(s"renderGroupTblResponse:: last sql: $lastGroupSql")
      val responseTbl: DataTable = execute(orgId, lastGroupSql, doFormatValues).syncGet()

      if (responseTbl.records.length != 0) {
        if (asColFromIndex != -1) { // render pivot table
          var pivotTblResponse: DataTable =
            transformGroupAsColumns(
              orgId,
              responseTbl,
              objQuery,
              groupFunctions,
              aggFunctions,
              orderFunctions,
              asColFromIndex,
              tableCols,
              doFormatValues
            )
          pivotTblResponse = mergeWithVerTotalValuesMap(
            pivotTblResponse,
            verTotalValuesMap,
            groupFunctions,
            aggFunctions,
            asColFromIndex,
            tableCols
          )
          if (asColFromIndex != 0)
            pivotTblResponse = rearrangeByFirstGroup(pivotTblResponse, firstGroupElems, groupFunctions(0))
          val isGroupCols =
            createIsGroupCols(pivotTblResponse.headers.length, asColFromIndex, aggFunctions.length, isCalcGroupTotals)
          pivotTblResponse.copy(isGroupCols = isGroupCols)
        } else { // render normal tabular table
          var result: DataTable = mergeWithVerTotalValuesMap(
            responseTbl,
            verTotalValuesMap,
            groupFunctions,
            aggFunctions,
            groupFunctions.length,
            tableCols
          )
          if (groupFunctions.length != 1 && firstGroupElems.nonEmpty)
            result = rearrangeByFirstGroup(result, firstGroupElems, groupFunctions(0))
          val isGroupCols =
            createIsGroupCols(result.headers.length, groupFunctions.length, aggFunctions.length, isCalcGroupTotals)
          result.copy(isGroupCols = isGroupCols)
        }
      } else { // query is empty, only return header
        val isGroupCols = Array.fill[Boolean](responseTbl.headers.length)(false)
        val displayHeaders = tableCols.map(c => c.name)
        responseTbl.headers.zipWithIndex.foreach {
          case (_, i) => responseTbl.headers(i) = displayHeaders(i)
        }
        responseTbl.copy(isGroupCols = isGroupCols)
      }
    }.rescue {
      case e: Throwable => throw e
    }

  private def isGroupedQuery(objQuery: ObjectQuery): Boolean = {
    objQuery.functions.exists(_.isGroupByFunc)
  }

  private def findAsColumnIndex(tableCols: Array[TableColumn]): Int = {
    tableCols
      .filter(c =>
        c.function match {
          case _: Select | _: GroupBy => true
          case _                      => false
        }
      )
      .indexWhere(c => c.isHorizontalView)
  }

  private def findFlattenColIndex(tableCols: Array[TableColumn]): Int = {
    tableCols
      .filter(c =>
        c.function match {
          case _: Select | _: GroupBy => true
          case _                      => false
        }
      )
      .indexWhere(c => c.isFlatten)
  }

  private def mergeWithVerTotalValuesMap(
      table: DataTable,
      valuesMap: mutable.HashMap[String, Object],
      groupFunctions: Array[Function],
      aggFunctions: Array[Function],
      toGroupIndex: Int,
      tableCols: Array[TableColumn]
  ): DataTable = {
    val baseHeaders = table.headers
    val baseColTypes = table.colTypes
    val baseRecordsTransposed = table.records.transpose

    val finalHeaders: ArrayBuffer[String] = ArrayBuffer.empty
    val finalColTypes: ArrayBuffer[String] = ArrayBuffer.empty
    val finalRecordsTransposed: ArrayBuffer[Array[Object]] = ArrayBuffer.empty

    val groupFuncCols = tableCols.filter(_.function.isGroupByFunc)
    val aggFuncCols = tableCols.filter(_.function.isAggregateFunc)

    for (groupIndex <- 0 until toGroupIndex) {
      if (groupIndex != groupFunctions.length - 1) {
        val curGroupColName = groupFuncCols(groupIndex).name
        finalHeaders += curGroupColName
        finalColTypes += baseColTypes(groupIndex)
        finalRecordsTransposed +=
          baseRecordsTransposed(groupIndex).map(formatByFunction(_, groupFunctions(groupIndex)))

        if (groupFuncCols(groupIndex).isCalcGroupTotal) {
          val numAffectedGroup = groupIndex + 1
          val intervals = findIntervals(baseRecordsTransposed, numAffectedGroup)

          aggFunctions.zipWithIndex.foreach {
            case (f, i) =>
              val aggColName = aggFuncCols(i).name
              val aggKeyStr = f.toString
              val row: ArrayBuffer[Object] = ArrayBuffer.empty
              intervals.foreach {
                case (startIndex, endIndex) =>
                  val groupKeyStr = table.records(startIndex).slice(0, numAffectedGroup).mkString(".")
                  val key = s"$groupKeyStr-$aggKeyStr"
                  row ++= Array.fill(endIndex - startIndex)(valuesMap(key))
              }
              finalHeaders += s"$aggColName by $curGroupColName"
              finalColTypes += baseColTypes(toGroupIndex + i)
              finalRecordsTransposed += row.toArray
          }
        }
      }
    }

    if (toGroupIndex == groupFunctions.length) {
      val lastGroupIndex = toGroupIndex - 1
      finalHeaders += groupFuncCols(lastGroupIndex).name
      finalColTypes += baseColTypes(lastGroupIndex)
      finalRecordsTransposed +=
        baseRecordsTransposed(lastGroupIndex).map(formatByFunction(_, groupFunctions(lastGroupIndex)))
      aggFunctions.zipWithIndex.foreach {
        case (f, i) =>
          val aggColName = aggFuncCols(i).name
          finalHeaders += aggColName
          finalColTypes += baseColTypes(toGroupIndex + i)
          finalRecordsTransposed += baseRecordsTransposed(lastGroupIndex + i + 1)
      }
    } else {
      for (i <- toGroupIndex until baseHeaders.length) {
        finalHeaders += baseHeaders(i)
        finalColTypes += baseColTypes(i)
        finalRecordsTransposed += baseRecordsTransposed(i)
      }
    }

    DataTable(finalHeaders.toArray, finalColTypes.toArray, finalRecordsTransposed.toArray.transpose)
  }

  private def buildVerTotalValuesMap(
      valuesMap: mutable.HashMap[String, Object],
      table: DataTable,
      curGroups: Array[Function],
      aggFunctions: Array[Function]
  ): Unit = {
    table.records.foreach(row => {
      val groupKeyStr = row.slice(0, curGroups.length).mkString(".")
      for (i <- aggFunctions.indices) {
        val aggValueIndex = curGroups.length + i
        val aggKeyStr = aggFunctions(i).toString
        val key = s"$groupKeyStr-$aggKeyStr"
        valuesMap(key) = row(aggValueIndex)
      }
    })
  }

  private def buildGroupOrderBy(
      groupFunctions: Array[Function],
      baseOrderFunctions: Array[OrderBy],
      isPriorityAggFn: Boolean
  ): Array[OrderBy] = {
    val groupOrderBys: Array[OrderBy] = groupFunctions.zipWithIndex
      .map {
        case (f, i) =>
          if (i != groupFunctions.length - 1) {
            baseOrderFunctions.find(orderBy => isFuncAppliedByOrderBy(orderBy, f)) match {
              case Some(x) => x
              case None    => OrderBy(f)
            }
          } else {
            baseOrderFunctions.find(orderBy => isFuncAppliedByOrderBy(orderBy, f)) match {
              case Some(x) => x
              case None    => null
            }
          }
      }
      .filter(f => f != null)

    val aggFnOrderBy = baseOrderFunctions.filter(_.function.isAggregateFunc)
    val firstAggFnIndex = baseOrderFunctions.indexWhere(_.function.isAggregateFunc)

    if (isPriorityAggFn || firstAggFnIndex == 0) {
      aggFnOrderBy ++ groupOrderBys
    } else {
      groupOrderBys ++ aggFnOrderBy
    }
  }

  private def isFuncAppliedByOrderBy(orderBy: OrderBy, targetFunc: Function): Boolean = {
    orderBy.function match {
      case f: DynamicFunction => f.getFinalFunction == targetFunc
      case _                  => orderBy.function == targetFunc
    }
  }

  private def buildObjectQueryWith(
      orgId: Long,
      currentObjQuery: ObjectQuery,
      groupFunctions: Seq[Function],
      aggFunctions: Seq[Function],
      orderByFunctions: Seq[OrderBy],
      originalConditions: Seq[Condition],
      aggregateConditions: Seq[AggregateCondition],
      joinConditions: Seq[JoinCondition],
      limit: Option[Limit]
  ): Future[String] = {
    val groupObjQuery = currentObjQuery.copy(
      functions = groupFunctions ++ aggFunctions,
      conditions = originalConditions,
      aggregateConditions = aggregateConditions,
      orders = orderByFunctions,
      joinConditions = joinConditions,
      limit = limit
    )
    parseQuery(orgId, groupObjQuery)
  }

  private def transformGroupAsColumns(
      orgId: Long,
      table: DataTable,
      curObjectQuery: ObjectQuery,
      groupFunctions: Array[Function],
      aggFunctions: Array[Function],
      baseOrderBys: Array[OrderBy],
      asColFromIndex: Int,
      tableCols: Array[TableColumn],
      doFormatValues: Boolean
  ): DataTable = {
    val headers = table.headers
    val colTypes = table.colTypes
    val rows = table.records

    val totalGroupNum = groupFunctions.length
    val aggFuncCols = tableCols.filter(_.function.isAggregateFunc)

    val finalRows = ArrayBuffer[Array[Object]]()
    val newColHeaders = ArrayBuffer[String]()
    val newColDataTypes = ArrayBuffer[String]()

    val colMap = mutable.HashMap[String, Int]()
    val rowMap = mutable.HashMap[String, Int]()

    // build elements for horizontal header of pivot table
    val horizontalElemsGroups = groupFunctions.slice(asColFromIndex, groupFunctions.length)
    val horizontalElemsOrders =
      buildGroupOrderBy(horizontalElemsGroups, baseOrderBys.filter(_.function.isInstanceOf[GroupBy]), false)

    val horizontalElemsSql: String = buildObjectQueryWith(
      orgId,
      curObjectQuery,
      horizontalElemsGroups,
      Seq.empty,
      horizontalElemsOrders,
      curObjectQuery.conditions,
      curObjectQuery.aggregateConditions,
      curObjectQuery.joinConditions,
      None
    ).syncGet()

    // format column by scalar function
    val horizontalElemsData: DataTable = execute(orgId, horizontalElemsSql, doFormatValues).syncGet()
    if (horizontalElemsData.records.length > 1000) {
      throw BadRequestError("can not transform to pivot table with more than 1000 columns")
    }
    horizontalElemsData.records.foreach(r => {
      for (i <- horizontalElemsGroups.indices)
        r(i) = formatByFunction(r(i), horizontalElemsGroups(i))
    })

    var horIndexCnt = 0
    horizontalElemsData.records.foreach(row => {
      if (aggFunctions.length == 0) {
        val key = buildKey(row, None)
        if (!colMap.contains(key)) {
          val header: String = row.mkString(".")
          newColHeaders += header
          newColDataTypes += "UInt32" // no data yet, temporary set number type
          colMap(key) = horIndexCnt
          horIndexCnt += 1
        }
      } else {
        aggFunctions.zipWithIndex.foreach {
          case (f, i) =>
            val colKey: String = buildKey(row, Some(aggFuncCols(i)))
            if (!colMap.contains(colKey)) {
              val header =
                if (aggFunctions.length == 1)
                  row.mkString(".")
                else
                  row.mkString(".") + s" - ${aggFuncCols(i).name}"
              newColHeaders += header
              newColDataTypes += colTypes(groupFunctions.length + i)
              colMap(colKey) = horIndexCnt
              horIndexCnt += 1
            }
        }
      }
    })

    // format column by scalar function
    rows.foreach(r => {
      for (i <- asColFromIndex until totalGroupNum) {
        r(i) = formatByFunction(r(i), groupFunctions(i))
      }
    })

    val horizontalLength: Int = asColFromIndex + colMap.size
    var verIndexCnt: Int = 0
    rows.foreach(row => {
      val rowKey: String = buildKey(row.slice(0, asColFromIndex), None)

      if (rowMap.contains(rowKey)) {
        // if this row already appears, find that row index (x) and find correct col index (y) and add value: table[x][y] = values
        val rowIndex: Int = rowMap(rowKey)
        aggFunctions.zipWithIndex.foreach {
          case (f, i) =>
            val colKey: String = buildKey(row.slice(asColFromIndex, totalGroupNum), Some(aggFuncCols(i)))
            val colIndex: Int = colMap(colKey)
            finalRows(rowIndex)(asColFromIndex + colIndex) = row(totalGroupNum + i)
        }
      } else {
        // else add a new row to final records, save index of new row in rowMap
        val curRow = new Array[Object](horizontalLength)
        for (i <- 0 until asColFromIndex) curRow(i) = row(i)
        aggFunctions.zipWithIndex.foreach {
          case (f, i) =>
            val colKey: String = buildKey(row.slice(asColFromIndex, totalGroupNum), Some(aggFuncCols(i)))
            val colIndex: Int = colMap(colKey)
            curRow(asColFromIndex + colIndex) = row(totalGroupNum + i)
        }
        rowMap(rowKey) = verIndexCnt
        verIndexCnt += 1
        finalRows += curRow
      }
    })

    val notAsColHeaders = ArrayBuffer[String]()
    val notAsColDataTypes = ArrayBuffer[String]()
    for (i <- 0 until asColFromIndex) {
      notAsColHeaders += headers(i)
      notAsColDataTypes += colTypes(i)
    }
    val finalHeaders = (notAsColHeaders ++ newColHeaders).toArray
    val finalColTypes = (notAsColDataTypes ++ newColDataTypes).toArray
    DataTable(finalHeaders, finalColTypes, finalRows.toArray)
  }

  /**
    * reorder response base on outer group (necessary if chart need sort in some way)
    */
  private def rearrangeByFirstGroup(
      table: DataTable,
      outerGroupElems: Array[String],
      firstGroup: Function
  ): DataTable = {
    val map = mutable.HashMap[String, mutable.MutableList[Array[Object]]]()
    val keys = outerGroupElems.map(formatByFunction(_, firstGroup).toString)
    keys.foreach(key => {
      map.put(key, mutable.MutableList.empty)
    })
    table.records.foreach(row => {
      val key = row(0).asString
      map(key) += row
    })
    val newRecords = ArrayBuffer[Array[Object]]()
    keys.foreach(key => {
      map.get(key) match {
        case Some(list) => list.foreach(row => newRecords += row)
        case None       => throw InternalError(s"can not find outer group for item: $key")
      }
    })
    DataTable(table.headers, table.colTypes, newRecords.toArray)
  }

  private def createIsGroupCols(
      sz: Int,
      asColFromIndex: Int,
      aggFnNum: Int,
      isCalcGroupTotals: Array[Boolean]
  ): Array[Boolean] = {
    val isGroupCols = Array.fill[Boolean](sz)(false)
    var cur = 0
    for (i <- 0 until asColFromIndex) {
      isGroupCols(cur) = true
      if (isCalcGroupTotals(i)) cur += aggFnNum
      cur += 1
    }
    isGroupCols
  }

  /**
    * interval of rows of the same $numCol outer group, range type: [start, end)
    */
  private def findIntervals(records: Array[Array[Object]], numCol: Int): Array[(Int, Int)] = {
    val res = ArrayBuffer[(Int, Int)]()
    var left, right = 0
    while (left < records(0).length) {
      var flag = true
      while (right < records(0).length && flag) {
        right += 1
        if (right < records(0).length)
          for (i <- 0 until numCol)
            if (records(i)(left) != records(i)(right)) flag = false
      }
      res += Tuple2(left, right)
      left = right
    }
    res.toArray
  }

  private def formatByFunction(value: Object, func: Function): Object = {
    func match {
      case f: GroupBy =>
        f.scalarFunction match {
          case Some(x) =>
            x match {
              case _: ToDayOfWeek  => DayOfWeekFormatter.format(value)
              case _: ToQuarterNum => QuarterNumFormatter.format(value)
              case _: ToMonthNum   => MonthNumFormatter.format(value)
              case _: ToDayNum     => DayNumFormatter.format(value)
              case _: ToWeekNum    => WeekNumFormatter.format(value)
              case _: ToHourNum    => HourNumFormatter.format(value)
              case _: ToMinuteNum  => MinuteNumFormatter.format(value)
              case _: ToSecondNum  => SecondNumFormatter.format(value)
              case _: ToMonth      => MonthFormatter.format(value)
              case _: ToQuarter    => QuarterFormatter.format(value)
              case _               => value
            }
          case None => value
        }
      case _ => value
    }
  }

  private def buildKey(row: Array[Object], aggFunctionCol: Option[TableColumn]): String = {
    if (aggFunctionCol.isDefined) {
      val aggColName: String = aggFunctionCol.get.name
      s"${row.mkString(".")}_$aggColName"
    } else {
      row.mkString(".")
    }
  }

  override def exportToFile(orgId: Long, query: Query, fileType: FileType): Future[String] = {
    connectionService.getTunnelConnection(orgId).flatMap { source: Connection =>
      val engine = engineResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      val parser: QueryParser = new QueryParserImpl(engine.getSqlParser())
      val sql: String = parser.parse(query, useAliasName = false)
      FileStorage.get(engine, source, sql, fileType)
    }
  }

}
