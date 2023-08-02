package co.datainsider.schema.client
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.responses.TableExpressionsResponse
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema}
import com.twitter.util.Future
import datainsider.client.exception.NotFoundError

import scala.collection.mutable

case class MockSchemaClientService() extends SchemaClientService {

  val databases = mutable.Map(
    "1001_database1" -> DatabaseSchema(
      "1001_database1",
      1001,
      "Database1",
      updatedTime = 0,
      createdTime = 0,
      tables = Seq(
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
      updatedTime = 0,
      createdTime = 0,
      tables = Seq(
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
      updatedTime = 0,
      createdTime = 0,
      tables = Seq(
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

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    Future.value(databases.values.toSeq.map(_.toDatabaseInfo()))
  }

  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    Future {
      val database = databases.get(dbName) match {
        case Some(database) => database
        case _              => throw NotFoundError(s"the database $dbName was not found.")
      }
      database
    }
  }

  override def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] =
    Future {
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
    }

  override def createOrMergeTableSchema(schema: TableSchema): Future[TableSchema] = Future(schema)

  override def ensureDatabaseCreated(organizationId: Long, name: String, displayName: Option[String]): Future[Unit] =
    Future.Unit

  override def renameTableSchema(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = Future.True

  override def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = Future.True

  override def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema] = ???

  override def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] = ???

  override def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse] =
    Future(TableExpressionsResponse(dbName, tblName, Map.empty))

  override def isDbExists(organizationId: Long, dbName: String): Future[Boolean] = ???

  override def isTblExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnNames: Seq[String]
  ): Future[Boolean] = ???

}
