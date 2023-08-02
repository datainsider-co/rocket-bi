package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.Implicits.async
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.misc.{ClickHouseDDLConverter, ColumnDetector}
import co.datainsider.schema.misc.ColumnDetector.RawColumnData
import com.twitter.inject.Logging
import com.twitter.util.Future

import java.sql.{ResultSet, ResultSetMetaData}
import scala.collection.mutable.ArrayBuffer

case class NonClusteredDDLExecutor(client: JdbcClient, handler: ClickhouseMetaDataHandler)
    extends DDLExecutor
    with Logging {
  override def existsDatabaseSchema(dbName: String): Future[Boolean] = {
    val query = s"show databases like ?"

    async {
      client.executeQuery(query, dbName)(_.next())
    }
  }

  override def existTableSchema(dbName: String, tblName: String, expectedColumnNames: Seq[String]): Future[Boolean] = {
    try {
      val query: String = s"desc `${dbName}`.`${tblName}`"
      client.executeQuery(query)((rs: ResultSet) => {
        if (expectedColumnNames.nonEmpty) {
          val columnNames = ArrayBuffer[String]()

          while (rs.next()) {
            columnNames += rs.getString("name")
          }

          expectedColumnNames.forall(columnNames.contains)
        } else {
          true
        }
      })
    } catch {
      case e: Throwable => {
        // ignore exception
        false
      }
    }
  }

  override def getDbNames(): Future[Seq[String]] = {
    val query = s"show databases"

    async {
      client.executeQuery(query)(rs => {
        val dbNames = ArrayBuffer[String]()

        while (rs.next()) {
          dbNames += rs.getString(1)
        }

        dbNames
      })
    }
  }

  override def dropDatabase(dbName: String): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toDropDatabaseDDL(dbName)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def getTableNames(dbName: String): Future[Seq[String]] = {
    val query = s"show tables from $dbName"

    async {
      client.executeQuery(query)(rs => {
        val tblNames = ArrayBuffer[String]()

        while (rs.next()) {
          tblNames += rs.getString(1)
        }

        tblNames
      })
    }
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toDropTableDDL(dbName, tblName)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] = dropTable(dbName, tblName)

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] = {
    val query = s"select * from system.columns where database = ? and table = ?"

    async {
      client.executeQuery(query, dbName, tblName)(rs => {
        val colNames = ArrayBuffer[String]()

        while (rs.next()) {
          colNames += rs.getString("name")
        }

        colNames.toSet
      })
    }
  }

  override def createDatabase(dbName: String): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toCreateDatabaseDDL(dbName)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def createTable(tableSchema: TableSchema): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toCreateTableDDL(tableSchema)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toRenameTableDDL(dbName, oldTblName, newTblName)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toAddColumnDLL(dbName, tblName, column)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean] = {
    Future.collect(columns.map(col => addColumn(dbName, tblName, col))).map(successes => successes.forall(_ == true))
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toUpdateColumnDLL(dbName, tblName, column)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] = {
    val query = ClickHouseDDLConverter.toDropColumnDDL(dbName, tblName, columnName)

    async {
      client.executeUpdate(query) >= 0
    }
  }

  // copy from ClusteredDDLExecutor
  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = {
    val encryptMode = ZConfig.getString("db.clickhouse.encryption.mode")
    val privateKey = ZConfig.getString("db.clickhouse.encryption.key")
    val initialVector = ZConfig.getString("db.clickhouse.encryption.iv")

    val insertedColumns: String = destTable.columns.map(_.name).mkString(",")
    val selectedColumns: String = sourceTable.columns
      .map(column => {
        if (encryptedColumnNames.contains(column.name)) {
          s"encrypt('$encryptMode', ${column.name}, unhex('$privateKey'), unhex('$initialVector'))"
        } else if (decryptedColumns.contains(column.name)) {
          s"decrypt('$encryptMode', ${column.name}, unhex('$privateKey'), unhex('$initialVector'))"
        } else {
          column.name
        }
      })
      .mkString(",")

    val query: String =
      s"""
         |insert into `${destTable.dbName}`.`${destTable.name}` ($insertedColumns)
         |select $selectedColumns from `${sourceTable.dbName}`.`${sourceTable.name}`
         |""".stripMargin

    async {
      logger.info(s"${this.getClass.getSimpleName}::migrateDataWithEncryption query: $query")
      client.executeUpdate(query)
    }.rescue {
      case e: Throwable => logger.error(s"migrateDataWithEncryption(${sourceTable.dbName}, ${destTable.name})", e)
    }

    true
  }

  override def scanTables(organizationId: Long, dbName: String): Future[Seq[TableSchema]] = {
    handler.getTables(organizationId, dbName, Seq.empty)
  }

  override def detectColumns(query: String): Future[Seq[Column]] = Future {
    val detectQuery: String =
      s"""
         |SELECT *
         |FROM (
         |  $query
         |)
         |WHERE 1 = 0""".stripMargin
    client.executeQuery(detectQuery)(rs => {
      val columns = ArrayBuffer[Column]()
      val metaData: ResultSetMetaData = rs.getMetaData
      val columnCount: Int = metaData.getColumnCount
      for (i <- 1 to columnCount) {
        val columnName: String = metaData.getColumnName(i)
        val columnType: Int = metaData.getColumnType(i)
        val isNullable: Boolean = metaData.isNullable(i) == ResultSetMetaData.columnNullable
        val column = RawColumnData(
          name = columnName,
          displayName = columnName,
          idType = columnType,
          isNullable = isNullable
        )
        columns += ColumnDetector.createColumn(column)
      }
      columns
    })
  }
}
