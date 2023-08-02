package co.datainsider.datacook.pipeline.operator.persist.writer

import co.datainsider.bi.util.profiler.Profiler
import com.twitter.util.logging.Logging
import datainsider.client.exception.{DbExecuteError, UnsupportedError}
import co.datainsider.bi.client.JdbcClient
import co.datainsider.datacook.pipeline.exception.{CreateDatabaseException, DropTableException}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * created 2022-08-25 10:54 AM
  * @author tvc12 - Thien Vi
  */
class VerticaWriter(protected val client: JdbcClient) extends JDBCWriter with Logging {

  override def write(dbName: String, tableName: String, columns: Seq[Column], records: Seq[Seq[Any]]): Int =
    Profiler("[Writer] VerticaWriter::write") {
      val queryInsertData = toInsertSQL(dbName, tableName, columns)
      logger.debug(s"VerticaWriter::writer::queryInsertData ${queryInsertData}")
      client.executeBatchUpdate(queryInsertData, records.map(_.toArray).toArray)
    }

  private def toInsertSQL(dbName: String, tblName: String, columns: Seq[Column]): String = {
    val columnNames: String = columns.map(column => s""" "${column.name}"""").mkString(",")
    val valuePlaceHolders: String = columns.map(_ => "?").mkString(", ")
    s"""INSERT INTO "$dbName"."$tblName"($columnNames) VALUES($valuePlaceHolders)"""
  }

  override def isTableExisted(dbName: String, tableName: String): Boolean = {
    try {
      val tableAsSets = client.getTables(null, dbName).toSet
      tableAsSets.contains(tableName)
    } catch {
      case ex: DbExecuteError =>
        logger.error(s"VerticaWriter::isTableExisted exception ${ex.getMessage}", ex)
        false
    }
  }

  private def ensureCreateDatabase(dbName: String): Unit = {
    try {
      val query = s"""CREATE SCHEMA IF NOT EXISTS "${dbName}" """
      val isSuccess: Boolean = client.executeUpdate(query) > 0
    } catch {
      case ex: Throwable =>
        logger.error(s"ensureCreateDatabase::create database failure ${ex.getMessage}", ex)
        throw CreateDatabaseException(s"create database failure, cause ${ex.getMessage}")
    }
  }

  override def ensureTableCreated(tableSchema: TableSchema): Unit = {
    ensureCreateDatabase(tableSchema.dbName)
    val query =
      s"""
        |CREATE TABLE IF NOT EXISTS "${tableSchema.dbName}"."${tableSchema.name}" (
        |	${toMultiColumnDDL(tableSchema.columns)}
        |);
        |""".stripMargin
    client.executeUpdate(query) >= 0
  }

  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(toColumnDDLExpr)
      .mkString(", ")
  }

  //https://www.vertica.com/docs/12.0.x/HTML/Content/Authoring/SQLReferenceManual/DataTypes/SQLDataTypes.htm
  private def toColumnDDLExpr(column: Column): String = {
    val dataType = column match {
      case _: BoolColumn       => "BOOLEAN"
      case _: Int8Column       => "TINYINT"
      case _: Int16Column      => "SMALLINT"
      case _: Int32Column      => "INT"
      case _: Int64Column      => "BIGINT"
      case _: UInt8Column      => "INT"
      case _: UInt16Column     => "INT"
      case _: UInt32Column     => "BIGINT"
      case _: UInt64Column     => "BIGINT"
      case _: FloatColumn      => "NUMBER"
      case _: DoubleColumn     => "NUMBER"
      case _: StringColumn     => "VARCHAR(65000)"
      case _: DateColumn       => "DATE"
      case _: DateTimeColumn   => "TIMESTAMP"
      case _: DateTime64Column => "TIMESTAMP"
      case _                   => throw UnsupportedError(s"This column isn't supported: ${column.getClass.getName}")
    }
    if (column.isNullable) {
      s""" "${column.name}" ${dataType} NULL"""
    } else {
      s""" "${column.name}" ${dataType} NOT NULL"""
    }
  }

  override def dropTable(dbName: String, tableName: String): Unit = {
    try {
      val dropQuery = s"""DROP TABLE IF EXISTS "${dbName}"."${tableName}" """
      client.executeUpdate(dropQuery) > 0
    } catch {
      case ex: Throwable =>
        throw DropTableException(s"drop table ${dbName}.${tableName} failed, cause ${ex.getMessage}", ex)
    }
  }
}
