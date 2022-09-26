package datainsider.ingestion.service

import com.twitter.util.Future
import datainsider.client.exception.NotFoundError

import datainsider.ingestion.controller.http.requests._
import datainsider.ingestion.controller.http.responses.{FullSchemaInfo, ListDatabaseResponse, TableExpressionsResponse}
import datainsider.ingestion.domain.Types.DBName
import datainsider.ingestion.domain._

import scala.collection.mutable

case class MockSchemaService() extends SchemaService {

  val databases = mutable.Map(
    "1001_database1" -> DatabaseSchema(
      "1001_database1",
      1001,
      "Database1",
      "abc",
      1234,
      1234,
      Seq(
        TableSchema(
          "transaction",
          "1001_database1",
          1001,
          "Transaction",
          Seq(
            DateTimeColumn("created_date", "Created Date"),
            StringColumn("location", "Location"),
            StringColumn("shop", "Shop"),
            StringColumn("sale", "Sale")
          )
        ),
        TableSchema(
          "operation",
          "1001_database1",
          1001,
          "Operation",
          Seq(
            StringColumn("resource", "Resource"),
            DoubleColumn("cost", "Cost"),
            DoubleColumn("profit", "Profit"),
            Int32Column("bill", "Bill")
          )
        ),
        TableSchema(
          "marketing",
          "1001_database1",
          1001,
          "Marketing",
          Seq(
            StringColumn("branding", "Branding"),
            Int8Column("quality", "Quality"),
            Int32Column("quantity", "Quantity"),
            StringColumn("inbound", "Inbound"),
            StringColumn("outbound", "Outbound"),
            StringColumn("comments", "Comments"),
            BoolColumn("sharing", "Sharing")
          )
        )
      )
    ),
    "1001_xshop" -> DatabaseSchema(
      "1001_xshop",
      1001,
      "XShop",
      "X",
      2234,
      2234,
      Seq(
        TableSchema(
          "marketing",
          "1001_xshop",
          1001,
          "Marketing",
          Seq(
            StringColumn("branding", "Branding"),
            Int8Column("quality", "Quality"),
            Int32Column("quantity", "Quantity"),
            StringColumn("inbound", "Inbound"),
            StringColumn("outbound", "Outbound"),
            StringColumn("comments", "Comments"),
            BoolColumn("sharing", "Sharing")
          )
        )
      )
    ),
    "1001_userx" -> DatabaseSchema(
      "1001_userx",
      1001,
      "UserX",
      "X",
      3234,
      3234,
      Seq(
        TableSchema(
          "operation",
          "1001_userx",
          1001,
          "Operation",
          Seq(
            StringColumn("resource", "Resource"),
            DoubleColumn("cost", "Cost"),
            DoubleColumn("profit", "Profit"),
            Int32Column("bill", "Bill")
          )
        )
      )
    )
  )

  override def addDatabase(dbSchema: DatabaseSchema): Future[DatabaseSchema] = {
    Future {
      databases.put(dbSchema.name, dbSchema)
      dbSchema
    }
  }

  override def createDatabase(request: CreateDBRequest): Future[DatabaseSchema] =
    Future {

      val databaseSchema = request.buildDatabaseSchema()
      databases.put(
        databaseSchema.name,
        DatabaseSchema(
          name = databaseSchema.name,
          organizationId = databaseSchema.organizationId,
          displayName = databaseSchema.displayName,
          request.currentUsername,
          System.currentTimeMillis(),
          System.currentTimeMillis(),
          tables = Seq.empty
        )
      )
      databaseSchema
    }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] =
    Future {
      databases.values.toSeq
    }

  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] =
    Future {
      val database = databases.get(dbName) match {
        case Some(database) => database
        case _              => throw NotFoundError(s"the database $dbName was not found.")
      }
      database
    }

  override def createTableSchema(request: CreateTableRequest): Future[TableSchema] = {
    Future {
      request.buildTableSchema()
    }
  }

  override def deleteTableSchema(request: DeleteTableRequest): Future[Boolean] = ???

  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] = ???

  override def deleteDatabase(organizationId: Long, request: DeleteDBRequest): Future[Boolean] = ???

  override def detect(request: DetectSchemaRequest): Future[Seq[Column]] = {
    Future.value(Seq.empty)
  }

  override def ensureDatabaseCreated(
      organizationId: Long,
      name: String,
      displayName: Option[String],
      creatorId: Option[String],
      force: Boolean = false
  ): Future[Unit] =
    ???

  override def isTableExists(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = ???

  override def createOrMergeTableSchema(schema: TableSchema): Future[Unit] = ???

  override def isDatabaseExists(organizationId: Long, dbName: String): Future[Boolean] = ???

  override def getTableSchema(dbName: String, tblName: String): Future[TableSchema] = ???

  override def createColumn(request: CreateColumnRequest): Future[TableSchema] = ???

  override def detectExpressionType(request: DetectExpressionTypeRequest): Future[String] = ???

  override def createTableSchema(request: CreateTableFromQueryRequest): Future[TableSchema] =
    Future {
      TableSchema(
        request.tblName,
        request.dbName,
        request.organizationId,
        request.displayName,
        Seq.empty
      )
    }

  override def detectAdhocTableSchema(request: DetectAdhocTableSchemaRequest): Future[TableSchema] =
    Future {
      TableSchema(
        "view",
        "adhoc_db",
        request.orgId,
        "view",
        Seq.empty
      )
    }

  override def detectColumns(query: String): Future[Array[Column]] = Future.value(Array.empty)

  override def updateColumn(request: UpdateColumnRequest): Future[TableSchema] = ???

  override def deleteCalculatedColumn(request: DeleteColumnRequest): Future[Boolean] = ???

  override def renameTableSchema(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = ???

  override def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = ???

  override def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema] = ???

  override def filterPermittedDatabases(
      organizationId: Long,
      databases: Seq[DatabaseSchema],
      userName: String
  ): Future[Seq[DatabaseSchema]] = {
    Future {
      databases
    }
  }

  override def listDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse] = ???

  override def listDeletedDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse] = ???

  override def removeDatabase(request: DeleteDBRequest): Future[Boolean] = ???

  override def restoreDatabase(request: DeleteDBRequest): Future[Boolean] = ???

  override def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean] = ???

  override def createTableSchemaIfNotExists(table: TableSchema): Future[TableSchema] = ???

  override def createTableSchema(
      organizationId: Long,
      tableFromQueryInfo: TableFromQueryInfo
  ): Future[TableSchema] = ???

  /**
    * Create table from schema, if schema existed throw exception
    */
  override def createTableSchema(table: TableSchema): Future[TableSchema] = ???

  /**
    * filter permitted database
    */
  override def getPermittedDatabase(
      organizationId: Long,
      dbNames: Seq[String],
      username: String
  ): Future[Seq[String]] = ???

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[DBName]): Future[Seq[FullSchemaInfo]] =
    Future.value(Seq())

  override def optimizeTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean] = Future.True

  override def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] = ???

  override def updateTableSchema(organizationId: Long, schema: TableSchema): Future[TableSchema] =
    Future {
      schema
    }

  override def createExprColumn(request: CreateExprColumnRequest): Future[TableSchema] = ???

  override def updateExprColumn(request: UpdateExprColumnRequest): Future[TableSchema] = ???

  override def deleteExprColumn(request: DeleteExprColumnRequest): Future[Boolean] = ???

  override def detectAggregateExpression(request: DetectExpressionTypeRequest): Future[String] = ???

  override def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse] = ???

  override def createCalcColumn(request: CreateExprColumnRequest): Future[TableSchema] = ???

  override def updateCalcColumn(request: UpdateExprColumnRequest): Future[TableSchema] = ???

  override def deleteCalcColumn(request: DeleteExprColumnRequest): Future[Boolean] = ???
}
