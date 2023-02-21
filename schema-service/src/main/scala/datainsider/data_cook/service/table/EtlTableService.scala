package datainsider.data_cook.service.table

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{VALUE_NULL, val2Opt}
import datainsider.client.domain.engine.clickhouse.DataFrame
import datainsider.client.domain.query._
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.TableConfiguration
import EtlTableService.findValueNotNull
import datainsider.client.exception.DbNotFoundError
import datainsider.data_cook.util.StringUtils
import datainsider.ingestion.controller.http.requests.TableFromQueryInfo
import datainsider.ingestion.domain.TableType.TableType
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.ColumnDetector
import datainsider.ingestion.util.ClickHouseUtils

trait EtlTableService {
  /**
   * get database name of etl
   */
  def getDbName(orgId: OrganizationId, jobId: EtlJobId): String


  /**
    * Create view from query
   *
   * @param id etl id
    * @param query for create view
    * @param destTableConfig config for destination, use generate default if none
    * @param aliasColumnDisplayNames override display name of column
    * @return
    */
  def creatView(
      organizationId: OrganizationId,
      id: EtlJobId,
      query: Query,
      destTableConfig: TableConfiguration,
      tableType: TableType = TableType.EtlView,
      aliasColumnDisplayNames: Array[String] = Array.empty
  ): Future[TableSchema]

  def removeAllTables(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  def removeTables(
      organizationId: OrganizationId,
      id: EtlJobId,
      tables: Array[TblName]
  ): Future[Boolean]

  /**
    * create table from query
    */
  def createTable(
      organizationId: OrganizationId,
      id: EtlJobId,
      querySetting: QuerySetting,
      destTableConfig: TableConfiguration
  ): Future[TableSchema]

  /**
    * insert data from query
    */
  def ingest(organizationId: OrganizationId, dbName: DBName, tblName: TblName, query: QuerySetting): Future[Unit]

  /**
    * Insert data from query to table if table is empty
    */
  def ingestIfTableEmpty(
      organizationId: OrganizationId,
      dbName: DBName,
      tblName: TblName,
      query: QuerySetting
  ): Future[Unit]

  /**
    * Delete all views by etl job id
    * @param organizationId current org
    * @param id etl id
    * @return
    */
  def dropEtlDatabase(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]
}
object EtlTableService extends Logging {
  val DEFAULT_DB_NAME = "ETL Database"

  // get db name by id
  @deprecated("use getDbName in implement of EtlTableService instead")
  def getDbName(organizationId: OrganizationId, id: EtlJobId, prefix: String = "etl"): String = {
    val rawDbName = s"${prefix}_${id}"
    ClickHouseUtils.buildDatabaseName(organizationId, rawDbName)
  }

  /**
    * QuerySetting to TableColumn for display
    * nếu setting là pivot thì chỉ lấy mỗi rows để làm display name
    * Các trường hợp khác thì để bình thường
    */
  def getTableColumnsForDisplay(querySetting: QuerySetting): Array[TableColumn] = {
    querySetting match {
      case pivotSetting: PivotTableSetting => {
        pivotSetting.rows.map(c => c.copy(isCalcGroupTotal = false))
      }
      case _ => querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
    }
  }

  def toDateHistogramColumn(columnName: String, displayName: String, scalarFunction: ScalarFunction): Option[Column] = Option {
    scalarFunction match {
      case _: ToSecondNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToMinuteNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToHourNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToDayNum => DateColumn(columnName, displayName, isNullable = true)
      case _: ToWeekNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToMonthNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToQuarterNum => StringColumn(columnName, displayName, isNullable = true)
      case _: ToYearNum => Int64Column(columnName, displayName, isNullable = true)

      case _: ToSecond => Int16Column(columnName, displayName, isNullable = true)
      case _: ToMinute => Int16Column(columnName, displayName, isNullable = true)
      case _: ToHour => Int8Column(columnName, displayName, isNullable = true)
      case _: ToMonth => StringColumn(columnName, displayName, isNullable = true)
      case _: ToDayOfWeek => StringColumn(columnName, displayName, isNullable = true)
      case _: ToDayOfMonth => Int64Column(columnName, displayName, isNullable = true)
      case _: ToDayOfYear => Int32Column(columnName, displayName, isNullable = true)
      case _: ToQuarter => StringColumn(columnName, displayName, isNullable = true)
      case _: ToYear => Int32Column(columnName, displayName, isNullable = true)
      case _ => null
    }
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
  def toColumn(dataFrame: DataFrame, tableColumn: Option[TableColumn], colIndex: Int): Column = {
    val columnName: String = StringUtils.normalizeName(dataFrame.headers(colIndex))
    val displayName: String = tableColumn.map(_.name).getOrElse(columnName)

    val column: Option[Column] = tableColumn match {
      case Some(column) => column.function match {
        case function: GroupBy if (function.scalarFunction.isDefined) => toDateHistogramColumn(columnName, displayName, function.scalarFunction.get)
        case _ => toColumnByColumnType(columnName, displayName, dataFrame.colTypes(colIndex))
      }
      case _ => None
    }

    column.getOrElse(toColumnByValue(dataFrame, columnName, displayName, colIndex))
  }

  /**
    * detect column from data frame and table columns columns
   *
   * @return
    */
  private def detectTableColumns(tableColumns: Array[TableColumn], dataFrame: DataFrame): Seq[Column] = {
    val headerSize: Int = dataFrame.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val column: Option[TableColumn] = tableColumns.lift(colIndex)
      toColumn(dataFrame, column, colIndex)
    }
  }

  /**
    * detect pivot correct,
    * nếu là cột thêm thì sẽ tự động kiểu dữ liệu là number,
    * còn nếu là cột bình thường, thì kiểu dữ liệu được detect
    */
  private def detectPivotColumns(setting: PivotTableSetting, dataFrame: DataFrame) = {
    val columns: Array[TableColumn] = setting.rows.map(_.copy(isCalcGroupTotal = false))

    val headerSize: Int = dataFrame.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val isFixedColumnType = colIndex < columns.length
      if (isFixedColumnType) {
        toColumn(dataFrame, columns.lift(colIndex), colIndex)
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
  def detectColumns(querySetting: QuerySetting, dataFrame: DataFrame): Seq[Column] = {
    querySetting match {
      case pivotSetting: PivotTableSetting => detectPivotColumns(pivotSetting, dataFrame)
      case _ => {
        val tableColumns = querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
        detectTableColumns(tableColumns, dataFrame)
      }
    }
  }

  /**
    * Detect basic type from column type
    */
  private def toColumnByColumnType(name: String, displayName: String, columnType: String): Option[Column] =
    Option {
      columnType match {
        case _ if columnType.contains("Array")      => null
        case _ if (columnType.contains("Nested"))   => null
        case _ if columnType.contains("UInt")       => Int64Column(name, displayName, isNullable = true)
        case _ if columnType.contains("Int")        => Int64Column(name, displayName, isNullable = true)
        case "Float32" | "Nullable(Float32)"        => FloatColumn(name, displayName, isNullable = true)
        case "Float64" | "Nullable(Float64)"        => DoubleColumn(name, displayName, isNullable = true)
        case "String"  | "Nullable(String)"         => StringColumn(name, displayName, Some(""), isNullable = true)
        case _ if columnType.contains("DateTime64") => DateTimeColumn(name, displayName, isNullable = true)
        case _ if columnType.contains("DateTime")   => DateTimeColumn(name, displayName, isNullable = true)
        case _                                      => null
      }
    }

  private def toColumnByValue(dataFrame: DataFrame, columnName: String, displayName: String, colIndex: Int): Column = {
    val value: Any = findValueNotNull(dataFrame.records, colIndex).getOrElse("")
    info(s"findValueNotNull for column name: ${columnName} - value: ${value} type: ${value.getClass.getSimpleName}")
    ColumnDetector.detectColumnByValue(columnName, displayName, value)
  }

  /**
    * Find value of data frame not null
    */
  def findValueNotNull(data: Array[Array[Object]], colIndex: Int): Option[Any] = {
    data.find(data => {
      val value: Any = data.lift(colIndex).orNull
      value != null && VALUE_NULL != value && value != ""
    }).map(data => data(colIndex))
  }

  def buildTableFromQueryInfo(
      dbName: String,
      query: String,
      destTableConfig: TableConfiguration,
      tableType: TableType = TableType.EtlView,
      aliasColumnDisplayNames: Array[String] = Array.empty
  ): TableFromQueryInfo = {
    TableFromQueryInfo(
      dbName = dbName,
      tblName = destTableConfig.tblName,
      displayName = destTableConfig.tblDisplayName,
      query = query,
      tableType = tableType,
      aliasColumnDisplayNames = aliasColumnDisplayNames
    )
  }
}
