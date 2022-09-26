package datainsider.data_cook.repository

import com.twitter.util.logging.Logging
import datainsider.client.util.JdbcClient
import datainsider.ingestion.domain.TableSchema

import java.sql.ResultSet
import javax.inject.{Inject, Named, Singleton}
import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 02/24/2022 - 4:21 PM
  */
@Singleton
class DwhRepository @Inject()(@Named("data_cook_clickhouse") clickHouseClient: JdbcClient) extends Logging {

  private def toClickhouseSelectQuery(table: TableSchema): String = {
    val columnNames = table.columns.map(column => s"`${column.name}`")
    s"SELECT ${columnNames.mkString(", ")} FROM `${table.dbName}`.`${table.name}`"
  }

  def read(table: TableSchema, chunkSize: Int, resultFn: (Seq[Seq[Any]]) => Unit): Long = {
    val selectQuery = toClickhouseSelectQuery(table)
    logger.info(s"selectQuery: ${selectQuery}")
    getData(selectQuery, table.columns.map(_.name).toArray, chunkSize, resultFn)
  }

  private def getValues(rs: ResultSet, columnNames: Array[String]): Seq[Any] = {
    columnNames.map(columnName => rs.getObject(columnName))
  }

  private def getData(query: String, columnNames: Array[String], chunkSize: Int, resultFn: (Seq[Seq[Any]]) => Unit): Long = {
    var totalRows: Long = 0
    clickHouseClient.executeQuery(query)(rs => {
      var records = ArrayBuffer.empty[Seq[Any]]
      while (rs.next()) {
        try {
          records += getValues(rs, columnNames)
          if (records.size > chunkSize) {
            totalRows += records.size
            resultFn(records.toSeq)
            records = ArrayBuffer.empty[Seq[Any]]
          }
        }
      }
      // empty
      if (records.nonEmpty) {
        totalRows += records.size
        resultFn(records.toSeq)
      }
    })
    totalRows
  }

}
