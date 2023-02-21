package datainsider.data_cook.pipeline.operator.persist.writer

import com.twitter.util.logging.Logging
import datainsider.client.exception.UnsupportedError
import datainsider.client.util.JdbcClient
import datainsider.data_cook.pipeline.exception.{CreateTableException, DropTableException}
import datainsider.ingestion.domain._

class OracleWriter(protected val client: JdbcClient) extends JDBCWriter with Logging {


  private def toCreateSQL(tableSchema: TableSchema): String = {
    s"""
      |CREATE TABLE ${escape(tableSchema.dbName)}.${escape(tableSchema.name)}(
      |   ${toMultiColumnDDL(tableSchema.columns)}
      |)
      |""".stripMargin
  }

  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(toColumnDDLExpr)
      .mkString(", ")
  }

  // https://docs.oracle.com/cd/E19501-01/819-3659/gcmaz/
  private def toColumnDDLExpr(column: Column): String = {
    val dataType = column match {
      case column: BoolColumn       => "NUMBER(1)"
      case column: Int8Column       => "NUMBER(5)"
      case column: Int16Column      => "NUMBER(10)"
      case column: Int32Column      => "NUMBER(10)"
      case column: Int64Column      => "NUMBER(19)"
      case column: UInt8Column      => "NUMBER"
      case column: UInt16Column     => "NUMBER"
      case column: UInt32Column     => "NUMBER"
      case column: UInt64Column     => "NUMBER"
      case column: FloatColumn      => "NUMBER(19,4)"
      case column: DoubleColumn     => "NUMBER(19,4)"
      case column: StringColumn     => "VARCHAR(255)"
      case column: DateColumn       => "DATE"
      case column: DateTimeColumn   => "DATE"
      case column: DateTime64Column => "DATE"
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
        |SELECT count(TABLE_NAME) AS NUMBER_TABLE  FROM all_tables
        |WHERE TABLE_NAME = ? AND OWNER = ?
        |""".stripMargin,
      tableName,
      dbName
    )(rs =>
      if (rs.next()) {
        rs.getInt("NUMBER_TABLE") > 0
      } else {
        false
      }
    )
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
  override def write(dbName: String, tableName: String, columns: Seq[Column], records: Seq[Seq[Any]]): Int = {
    val insertQuery = toInsertSQL(dbName, tableName, columns)
    client.executeBatchUpdate(insertQuery, records)
  }


  @throws[CreateTableException]
  override def ensureTableCreated(tableSchema: TableSchema): Unit = {
    if (!isTableExisted(tableSchema.dbName, tableSchema.name)) {
      createTable(tableSchema)
    }
  }

  @throws[CreateTableException]
  protected def createTable(tableSchema: TableSchema): Boolean = {
    try {
      val createQuery = toCreateSQL(tableSchema)
      logger.info(s"createTable:: ${createQuery}")
      client.executeUpdate(createQuery) > 0
    } catch {
      case ex: Throwable => throw CreateTableException(s"create table ${tableSchema.dbName}.${tableSchema.name} failed, cause ${ex.getMessage}", ex)
    }
  }

  @throws[DropTableException]
  override def dropTable(dbName: String, tblName: String): Unit = {
    try {
      val dropQuery = s"""DROP TABLE ${escape(dbName)}.${escape(tblName)}"""
      logger.info(s"dropTable:: ${dropQuery}")
      client.executeUpdate(dropQuery) > 0
    } catch {
      case ex: Throwable => throw DropTableException(s"drop table ${dbName}.${tblName} failed, cause ${ex.getMessage}", ex)
    }
  }

  protected def escape(text: String): String = {
    s""""${text}""""
  }
}
