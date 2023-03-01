package datainsider.ingestion.repository

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.util.{JdbcClient, JsonParser}
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.ingestion.domain.{Column, DateTime64Column, TableSchema}
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.misc.{ClickHouseDDLConverter, JdbcClient}
import datainsider.ingestion.util.ClickHouseUtils

import java.sql.ResultSet

/**
  * @author andy
  * @since 7/10/20
  */
trait DataRepository {

  def exists(dbName: String, tblName: String, properties: Map[String, Any]): Future[Boolean]

  def writeRecords(schema: TableSchema, records: Seq[Record], batchSize: Int): Future[Int]

  def writeRecords(schema: TableSchema, records: Array[Array[Object]], batchSize: Int): Future[Int]

  def update(
      dbName: String,
      tblName: String,
      primaryIds: Map[String, Any],
      columnValueMap: Map[String, Any]
  ): Future[Int]

  def clearTable(dbName: String, tblName: String): Future[Boolean]

  /*
   * Get Total Row of table
   */
  def getTotalRow(dbName: DBName, tblName: TblName): Future[Long]
}

case class ClickHouseDataRepository(client: JdbcClient) extends DataRepository with Logging {

  override def exists(dbName: String, tblName: String, properties: Map[String, Any]): Future[Boolean] = {
    Future {
      val query = properties.map(_._1).map(s => s"$s=?").mkString(" AND ")
      val fields = properties.map(_._2).toSeq

      val queryExpr = s"""|SELECT COUNT(*) FROM `$dbName`.`$tblName`
                          |WHERE $query
                          |""".stripMargin
      client.executeQuery(queryExpr, fields: _*)(readCount) > 0
    }
  }

  override def writeRecords(schema: TableSchema, records: Seq[Record], batchSize: Int): Future[Int] = {
    writeRecords(schema.dbName, schema.name, schema.columns, records, batchSize)
  }

  override def writeRecords(schema: TableSchema, records: Array[Array[Object]], batchSize: Int): Future[Int] = {
    writeRecords(schema.dbName, schema.name, schema.columns, records, batchSize)
  }

  def writeRecords(
      dbName: String,
      tblName: String,
      columns: Seq[Column],
      records: Array[Array[Object]],
      batchSize: Int
  ): Future[Int] = {
    Future {
      val insertColumns = dropMaterializedColumns(columns)
      val insertQuery = ClickHouseDDLConverter().toInsertSQL(dbName, tblName, insertColumns)

      records
        .map(ClickHouseUtils.normalizeToCorrespondingType(insertColumns, _))
        .grouped(batchSize)
        .map(client.executeBatchUpdate(insertQuery, _))
        .sum
    }.onFailure { ex =>
      error(s"${this.getClass.getSimpleName}::writeRecords fail for table $dbName.$tblName", ex)
    }
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
      val insertQuery = ClickHouseDDLConverter().toInsertSQL(dbName, tblName, insertColumns, isApplyEncryption = true)

      records
        .map(ClickHouseUtils.normalizeToCorrespondingType(insertColumns, _))
        .grouped(batchSize)
        .map(client.executeBatchUpdate(insertQuery, _))
        .sum
    }.onFailure { ex =>
      error(s"${this.getClass.getSimpleName}::writeRecords fail for table $dbName.$tblName", ex)
    }
  }

  override def update(
      dbName: String,
      tblName: String,
      primaryIds: Map[String, Any],
      columnValueMap: Map[String, Any]
  ): Future[Int] = {
    Future {
      val filterQuery = primaryIds.map(_._1).map(s => s"$s=?").mkString(" AND ")
      val filterFields = primaryIds.map(_._2).map(ClickHouseUtils.normalizeToCorrespondingType(_)).toSeq

      val updateQuery = columnValueMap.map(_._1).map(s => s"$s=?").mkString(", ")
      val updateFields = columnValueMap.map(_._2).map(ClickHouseUtils.normalizeToCorrespondingType(_)).toSeq

      client.executeUpdate(
        s"""
           |ALTER TABLE `$dbName`.`$tblName`
           |UPDATE $updateQuery
           |WHERE $filterQuery
           |""".stripMargin,
        (updateFields ++ filterFields): _*
      )
    }
  }

  override def clearTable(dbName: String, tblName: String): Future[Boolean] = {
    Future {
      client.executeUpdate(s"TRUNCATE TABLE `$dbName`.`$tblName`") >= 0
    }
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

  override def getTotalRow(dbName: DBName, tblName: TblName): Future[Long] =
    Future {
      val count = client.executeQuery(s"select count(*) as total from `${dbName}`.`${tblName}`")(readCount)
      info(s"getTotalRow:: ${dbName}.${tblName} = ${count}")
      count
    }
}
