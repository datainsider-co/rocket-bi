package co.datainsider.datacook.pipeline.operator.persist.writer

import com.twitter.util.logging.Logging
import datainsider.client.exception.UnsupportedError
import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.datacook.pipeline.exception.{CreateDatabaseException, CreateTableException, DropTableException}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

class MySQLWriter(client: JdbcClient) extends JDBCWriter with Logging {

  private def toCreateSQL(tableSchema: TableSchema): String = {
    s"""
      |CREATE TABLE ${escape(tableSchema.dbName)}.${escape(tableSchema.name)}(
      | ${toMultiColumnDDL(tableSchema.columns)}
      |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
      |""".stripMargin
  }

  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(toColumnDDLExpr)
      .mkString(", ")
  }

  // https://dev.mysql.com/doc/refman/8.0/en/integer-types.html
  // https://docs.oracle.com/cd/E19501-01/819-3659/gcmaz/
  private def toColumnDDLExpr(column: Column): String = {
    val dataType = column match {
      case column: BoolColumn       => "TINYINT(1)"
      case column: Int8Column       => "SMALLINT"
      case column: Int16Column      => "MEDIUMINT"
      case column: Int32Column      => "INTEGER"
      case column: Int64Column      => "BIGINT"
      case column: UInt8Column      => "SMALLINT UNSIGNED"
      case column: UInt16Column     => "MEDIUMINT UNSIGNED"
      case column: UInt32Column     => "INTEGER UNSIGNED"
      case column: UInt64Column     => "BIGINT UNSIGNED"
      case column: FloatColumn      => "FLOAT"
      case column: DoubleColumn     => "DOUBLE"
      case column: StringColumn     => "VARCHAR(255)"
      case column: DateColumn       => "DATE"
      case column: DateTimeColumn   => "DATETIME"
      case column: DateTime64Column => "DATETIME"
      case _                        => throw UnsupportedError(s"This column isn't supported: ${column.getClass.getName}")
    }
    if (column.isNullable) {
      s"""${escape(column.name)} ${dataType} NULL"""
    } else {
      s"""${escape(column.name)} ${dataType} NOT NULL"""
    }
  }

  override def isTableExisted(dbName: String, tableName: String): Boolean = {
    client.executeQuery(
      """
        |SELECT count(TABLE_NAME) AS NUMBER_TABLE
        |FROM information_schema.tables
        |WHERE table_schema = ? AND table_name = ?
        |""".stripMargin,
      dbName,
      tableName
    )(rs =>
      if (rs.next()) {
        rs.getInt("NUMBER_TABLE") > 0
      } else {
        false
      }
    )
  }

  protected def escape(text: String): String = {
    s"`${text}`"
  }

  def isDatabaseTableExisted(dbName: String): Boolean = {
    client.executeQuery(
      """
        |SELECT count(SCHEMA_NAME) AS NUMBER_DATABASE
        |FROM INFORMATION_SCHEMA.SCHEMATA
        |WHERE SCHEMA_NAME = ?
        |""".stripMargin,
      dbName
    )(rs =>
      if (rs.next()) {
        rs.getInt("NUMBER_DATABASE") > 0
      } else {
        false
      }
    )
  }

  @throws[CreateDatabaseException]
  @throws[CreateTableException]
  override def ensureTableCreated(tableSchema: TableSchema): Unit = {
    if (!isDatabaseTableExisted(tableSchema.dbName)) {
      createDatabase(tableSchema.dbName)
    }
    if (!isTableExisted(tableSchema.dbName, tableSchema.name)) {
      createTable(tableSchema)
    }
  }

  @throws[CreateDatabaseException]
  def createDatabase(dbName: String): Boolean = {
    try {
      val createDatabaseQuery =
        s"""
           |CREATE DATABASE IF NOT EXISTS ${escape(dbName)}
           |""".stripMargin
      client.executeUpdate(createDatabaseQuery) > 0
    } catch {
      case ex: Throwable => throw CreateDatabaseException(s"create table ${dbName} failed, cause ${ex.getMessage}", ex)
    }
  }

  protected def createTable(tableSchema: TableSchema): Boolean = {
    try {
      val createQuery = toCreateSQL(tableSchema)
      client.executeUpdate(createQuery) > 0
    } catch {
      case ex: Throwable =>
        throw CreateTableException(
          s"create table ${tableSchema.dbName}.${tableSchema.name} failed, cause ${ex.getMessage}",
          ex
        )
    }
  }

  @throws[DropTableException]
  override def dropTable(dbName: String, tblName: String): Unit = {
    try {
      val dropQuery = s"""DROP TABLE ${escape(dbName)}.${escape(tblName)}"""
      client.executeUpdate(dropQuery) > 0
    } catch {
      case ex: Throwable =>
        throw DropTableException(s"drop table ${dbName}.${tblName} failed, cause ${ex.getMessage}", ex)
    }
  }

  protected def toInsertSQL(dbName: String, tblName: String, columns: Seq[Column]): String = {
    val columnNames = columns.map(column => s"""${escape(column.name)}""")
    val valuePlaceHolders = columnNames.map(_ => "?").mkString(", ")
    s"""INSERT INTO ${escape(dbName)}.${escape(tblName)}(${columnNames.mkString(", ")}) VALUES($valuePlaceHolders)"""
  }

  /**
    * Write data to table with config
    *
    * @param dbName        : dest database
    * @param tableName  : dest table
    * @param columns        : column schema
    * @param records      : records will write
    * @return number of row write success
    */
  override def write(dbName: String, tableName: String, columns: Seq[Column], records: Seq[Record]): Int = {
    val insertQuery = toInsertSQL(dbName, tableName, columns)
    client.executeBatchUpdate(insertQuery, records.toArray)
  }
}
