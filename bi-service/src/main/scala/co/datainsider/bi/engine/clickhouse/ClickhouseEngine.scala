package co.datainsider.bi.engine.clickhouse

import java.sql.{ResultSet, ResultSetMetaData, SQLException}
import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.{DateTimeFormatter, DoubleFormatter, ZConfig}
import com.clickhouse.jdbc.ClickHouseStruct
import datainsider.profiler.Profiler
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.inject.Logging
import datainsider.client.exception.{DbExecuteError, InternalError}

import java.sql
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

case class DataTable(
    headers: Array[String],
    colTypes: Array[String],
    records: Array[Array[Object]],
    isGroupCols: Array[Boolean] = Array.empty,
    formatterKeys: Array[String] = Array.empty
)

class ClickhouseEngine @Inject() (@Named("clickhouse") client: JdbcClient) extends Engine[DataTable] with Logging {

  val maxQueryRows: Int = ZConfig.getInt("clickhouse_engine.max_query_rows", 10000)

  /**
    * Return data are 2d array, arranged in row manner (just like result from normal sql execution)
    * First row of matrix (array[0][_]) are column names
    * The rest are row data from sql (array[1][_]...array[n][_])
    */
  override def execute(sql: String, doFormatValues: Boolean = true): DataTable = {
    Profiler("engine.execute") {
      try {
        client.executeQuery(sql)(rs => {
          val (colNames, colTypes) = getColMetaData(rs)
          val rows = ArrayBuffer[Array[Object]]()
          while (rs.next()) {
            require(rows.length <= maxQueryRows, s"result table exceeds $maxQueryRows rows limit")

            val row = ArrayBuffer[Object]()
            colNames.zip(colTypes).foreach {
              case (colName, colType) =>
                """Array\(\w*\)""".r.findFirstMatchIn(colType) match {
                  case Some(_) =>
                    row += rs.getString(colName)
                  case None =>
                    val rawValue = rs.getObject(colName)

                    val finalValue = if (doFormatValues) {
                      formatValue(rawValue, colType)
                    } else rawValue

                    row += finalValue
                }
              case _ =>
            }
            rows += row.toArray
          }
          DataTable(colNames, colTypes, rows.toArray)
        })
      } catch {
        case e: SQLException => throw DbExecuteError(s"execute sql '$sql' failed with exception: ${e.getMessage}", e)
        case e: Throwable    => throw InternalError(s"engine.execute failed with exception: ${e.getMessage}", e)
      }
    }
  }

  override def executeHistogramQuery(histogramSql: String): DataTable = {
    try {
      client.executeQuery(histogramSql)(rs => {
        val colNames = Array("lower_bound", "upper_bound", "value")
        val colTypes = Array("Float64", "Float64", "Float64")
        val rows = ArrayBuffer[Array[Object]]()
        while (rs.next()) {
          val histogramArr = rs.getArray(1).getArray.asInstanceOf[Array[Object]]

          histogramArr.foreach(arr => {
            val javaList = arr.asInstanceOf[java.util.ArrayList[Double]]

            val lower = javaList.get(0).asInstanceOf[Object]
            val upper = javaList.get(1).asInstanceOf[Object]
            val value = javaList.get(2).asInstanceOf[Object]

            rows += Array(lower, upper, value)
          })
        }
        DataTable(colNames, colTypes, rows.toArray)
      })
    } catch {
      case _: DbExecuteError => throw DbExecuteError(s"fail to execute histogram query")
    }
  }

  private def getColMetaData(rs: ResultSet): (Array[String], Array[String]) = {
    val metadata: ResultSetMetaData = rs.getMetaData
    val colCount = metadata.getColumnCount
    val colNames = ArrayBuffer[String]()
    val colTypes = ArrayBuffer[String]()

    for (i <- 1 to colCount) {
      colNames += metadata.getColumnLabel(i)
      colTypes += metadata.getColumnTypeName(i)
    }

    (colNames.toArray, colTypes.toArray)
  }

  /**
    * pre format data, useful for making additional where condition (i.e: compare values for group query)
    */
  private def formatValue(value: Object, colType: String): Object = {
    if (value != null) {
      colType.toLowerCase match {
        case t if isDateTime(t)   => DateTimeFormatter.format(value)
        case t if isDoubleType(t) => DoubleFormatter.format(value)
        case _                    => value
      }
    } else null
  }

  private def isDoubleType(colType: String): Boolean = {
    colType.toLowerCase.contains("float")
  }

  private def isDateTime(colType: String): Boolean = {
    colType.toLowerCase.contains("datetime")
  }

}
