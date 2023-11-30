package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.chart.{ChartSetting, PivotTableSetting, TableColumn}
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.service.QueryExecutor
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.util.StringUtils
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.requests.TableFromQueryInfo
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema, TableType}
import co.datainsider.schema.misc.{ClickHouseUtils, ColumnDetector}
import co.datainsider.schema.service.{IngestionService, SchemaService}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, VALUE_NULL, async}
import datainsider.client.exception.{DbNotFoundError, InternalError}

import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 4:30 PM
  */

trait OperatorService {
  def getDbName(organizationId: OrganizationId, id: EtlJobId): String

  def createViewTable(organizationId: OrganizationId, id: EtlJobId, query: Query, config: DestTableConfig, aliasDisplayNames: Seq[String] = Seq.empty): Future[TableSchema]

  def createTable(organizationId: OrganizationId, id: EtlJobId, querySetting: ChartSetting, destTableConfig: DestTableConfig): Future[TableSchema]

  def dropETLDatabase(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  def ingestIfTableEmpty(fromChartSetting: ChartSetting, destTableSchema: TableSchema): Future[Unit]

  def getMaxValue(orgId: Long, dbName: String, tblName: String, columnName: String, columnType: String): Future[String]

  def removeAllTables(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  def removeTables(organizationId: OrganizationId, id: EtlJobId, tblNames: Array[String]): Future[Boolean]

  def getTableSchema(organizationId: OrganizationId, dbName: String, tblName: String): Future[TableSchema]
}



object OperatorService extends Logging {

  // get db name by id
  @deprecated("use getDbName in implement of EtlTableService instead")
  def getDbName(organizationId: OrganizationId, id: EtlJobId, prefix: String = "etl"): String = {
    val rawDbName: String = s"${prefix}_${id}"
    ClickHouseUtils.buildDatabaseName(organizationId, rawDbName)
  }

  /**
    * Create Column from TableColumn & Value:
    *
    * - nếu cột là group + scalar là date => date column
    *
    * - Lấy datatype từ data frame để tạo column
    *
    * - Nếu column không thể tạo được từ 2 bước trên, tự động lấy data từ value
    *
    * => Default: StringColumn
    */
  def detectColumn(dataTable: DataTable, tableColumn: Option[TableColumn], colIndex: Int): Column = {
    val columnName: String = StringUtils.normalizeName(dataTable.headers(colIndex))
    val displayName: String = tableColumn.map(_.name).getOrElse(columnName)

    val column: Option[Column] = tableColumn match {
      case Some(column) =>
        column.function match {
          case function: GroupBy if (function.scalarFunction.isDefined) =>
            toDateHistogramColumn(columnName, displayName, function.scalarFunction.get)
          case _ => detectColumnByColumnType(columnName, displayName, dataTable.colTypes(colIndex))
        }
      case _ => None
    }

    column.getOrElse(detectColumnByValue(dataTable, columnName, displayName, colIndex))
  }

  private def toDateHistogramColumn(
      columnName: String,
      displayName: String,
      scalarFunction: ScalarFunction
  ): Option[Column] =
    Option {
      scalarFunction match {
        case _: ToSecondNum  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToMinuteNum  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToHourNum    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayNum     => DateColumn(columnName, displayName, isNullable = true)
        case _: ToWeekNum    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToMonthNum   => StringColumn(columnName, displayName, isNullable = true)
        case _: ToQuarterNum => StringColumn(columnName, displayName, isNullable = true)
        case _: ToYearNum    => Int64Column(columnName, displayName, isNullable = true)

        case _: ToSecond     => Int16Column(columnName, displayName, isNullable = true)
        case _: ToMinute     => Int16Column(columnName, displayName, isNullable = true)
        case _: ToHour       => Int8Column(columnName, displayName, isNullable = true)
        case _: ToMonth      => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayOfWeek  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayOfMonth => Int64Column(columnName, displayName, isNullable = true)
        case _: ToDayOfYear  => Int32Column(columnName, displayName, isNullable = true)
        case _: ToQuarter    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToYear       => Int32Column(columnName, displayName, isNullable = true)
        case _               => null
      }
    }

  /**
    * detect column from data frame and table columns columns
    *
    * @return
    */
  private def detectTransformColumns(tableColumns: Array[TableColumn], dataTable: DataTable): Seq[Column] = {
    val headerSize: Int = dataTable.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val column: Option[TableColumn] = tableColumns.lift(colIndex)
      detectColumn(dataTable, column, colIndex)
    }
  }

  /**
    * detect pivot correct,
    * nếu là cột thêm thì sẽ tự động kiểu dữ liệu là number,
    * còn nếu là cột bình thường, thì kiểu dữ liệu được detect
    */
  private def detectPivotColumns(setting: PivotTableSetting, dataFrame: DataTable) = {
    val columns: Array[TableColumn] = setting.rows.map(_.copy(isCalcGroupTotal = false))

    val headerSize: Int = dataFrame.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val isFixedColumnType = colIndex < columns.length
      if (isFixedColumnType) {
        detectColumn(dataFrame, columns.lift(colIndex), colIndex)
      } else {
        val columnName: String = StringUtils.normalizeName(dataFrame.headers(colIndex))
        val displayName: String = columns.lift(colIndex).map(_.name).getOrElse(columnName)
        DoubleColumn(columnName, displayName, None, defaultValue = None, isNullable = true)
      }
    }
  }

  /**
    * detect column from data frame and table columns columns
    * @return
    */
  def detectColumns(querySetting: ChartSetting, dataFrame: DataTable): Seq[Column] = {
    querySetting match {
      case pivotSetting: PivotTableSetting => detectPivotColumns(pivotSetting, dataFrame)
      case _ => {
        val tableColumns = querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
        detectTransformColumns(tableColumns, dataFrame)
      }
    }
  }

  /**
    * Detect basic type from column type
    */
  private def detectColumnByColumnType(name: String, displayName: String, columnType: String): Option[Column] =
    Option {
      columnType match {
        case _ if columnType.contains("Array")      => null
        case _ if (columnType.contains("Nested"))   => null
        case _ if columnType.contains("UInt")       => Int64Column(name, displayName, isNullable = true)
        case _ if columnType.contains("Int")        => Int64Column(name, displayName, isNullable = true)
        case "Float32" | "Nullable(Float32)"        => FloatColumn(name, displayName, isNullable = true)
        case "Float64" | "Nullable(Float64)"        => DoubleColumn(name, displayName, isNullable = true)
        case "String" | "Nullable(String)"          => StringColumn(name, displayName, Some(""), isNullable = true)
        case _ if columnType.contains("DateTime64") => DateTimeColumn(name, displayName, isNullable = true)
        case _ if columnType.contains("DateTime")   => DateTimeColumn(name, displayName, isNullable = true)
        case _                                      => null
      }
    }

  private def detectColumnByValue(
      dataFrame: DataTable,
      columnName: String,
      displayName: String,
      colIndex: Int
  ): Column = {
    val value: Any = findNotNullValue(dataFrame.records, colIndex).getOrElse("")
    info(s"findValueNotNull for column name: ${columnName} - value: ${value} type: ${value.getClass.getSimpleName}")
    ColumnDetector.detectColumnByValue(columnName, displayName, value)
  }

  /**
    * Find value of data frame not null
    */
  private def findNotNullValue(data: Array[Array[Object]], colIndex: Int): Option[Any] = {
    data
      .find(data => {
        val value: Any = data.lift(colIndex).orNull
        value != null && VALUE_NULL != value && value != ""
      })
      .map(data => data(colIndex))
  }
}
