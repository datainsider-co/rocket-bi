package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.misc.{ClickHouseDDLConverter, ClickHouseUtils}
import com.twitter.inject.Logging
import com.twitter.util.Future

import java.sql.ResultSet

/**
  * @author andy
  * @since 7/10/20
  */
@deprecated("to be removed")
trait DataRepository {

  def exists(dbName: String, tblName: String, properties: Map[String, Any]): Future[Boolean]

  def writeRecords(schema: TableSchema, records: Seq[Record], batchSize: Int): Future[Int]

  def clearTable(dbName: String, tblName: String): Future[Boolean]

  /*
   * Get Total Row of table
   */
  def getTotalRow(dbName: String, tblName: String): Future[Long]
}

case class ClickHouseDataRepository(client: JdbcClient) extends DataRepository with Logging {

  override def exists(dbName: String, tblName: String, properties: Map[String, Any]): Future[Boolean] = {
    Future {
      val query = properties.keys.map(s => s"`$s`=?").mkString(" AND ")
      val fields = properties.values.toSeq

      val queryExpr = s"""|SELECT COUNT(*) FROM `$dbName`.`$tblName`
                          |WHERE $query
                          |""".stripMargin
      client.executeQuery(queryExpr, fields: _*)(readCount) > 0
    }
  }

  override def writeRecords(schema: TableSchema, records: Seq[Record], batchSize: Int): Future[Int] = {
    writeRecords(schema.dbName, schema.name, schema.columns, records, batchSize)
  }

  private def writeRecords(
      dbName: String,
      tblName: String,
      columns: Seq[Column],
      records: Seq[Record],
      batchSize: Int
  ): Future[Int] = {
    Future {
      val insertColumns: Seq[Column] = dropMaterializedColumns(columns)
      val insertQuery = ClickHouseDDLConverter.toInsertSQL(dbName, tblName, insertColumns, isApplyEncryption = true)

      records
        .map(ClickHouseUtils.normalizeToCorrespondingType(insertColumns, _))
        .toArray
        .grouped(batchSize)
        .map(client.executeBatchUpdate(insertQuery, _))
        .sum
    }.onFailure { ex =>
      error(s"${this.getClass.getSimpleName}::writeRecords fail for table $dbName.$tblName", ex)
    }
  }

  override def clearTable(dbName: String, tblName: String): Future[Boolean] =
    Future {
      client.executeUpdate(s"TRUNCATE TABLE `$dbName`.`$tblName`") >= 0
    }

  private def dropMaterializedColumns(columns: Seq[Column]): Seq[Column] = {
    columns.filterNot(_.isMaterialized())
  }

  private def readCount(rs: ResultSet): Int = {
    if (rs.next()) {
      rs.getInt(1)
    } else {
      0
    }
  }

  override def getTotalRow(dbName: String, tblName: String): Future[Long] =
    Future {
      client.executeQuery(s"select count(*) as total from `${dbName}`.`${tblName}`")(readCount)
    }
}
