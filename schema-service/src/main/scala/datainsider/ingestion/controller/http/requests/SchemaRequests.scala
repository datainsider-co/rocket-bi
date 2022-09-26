package datainsider.ingestion.controller.http.requests

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.{NotEmpty, Pattern}
import datainsider.client.filter.LoggedInRequest
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.ingestion.domain.TableType.TableType
import datainsider.ingestion.domain.Types.DBName
import datainsider.ingestion.domain._
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.Implicits.ImplicitString

import javax.inject.Inject

/**
  * @author andy
  * @since 7/14/20
  */

/**
  *  TODO: organizationId as optional for now only.
  *  This param will be required from the client side in the future
  * @param organizationId
  * @param request
  */
case class ListDBRequest(
    @QueryParam organizationId: Option[Long],
    @Inject request: Request
) extends LoggedInRequest

case class CreateDBRequest(
    @NotEmpty @Pattern(regexp = "\\w+") name: String,
    displayName: Option[String],
    @Inject request: Request = null
) extends LoggedInRequest {

  def buildDatabaseSchema(): DatabaseSchema = {
    DatabaseSchema(
      name = ClickHouseUtils.buildDatabaseName(request.currentOrganizationId.get, name),
      organizationId = request.currentOrganizationId.get,
      displayName = displayName.getOrElse(name.asPrettyDisplayName),
      creatorId = request.currentUsername,
      createdTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      tables = Seq.empty
    )
  }

}

case class GetDbRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @Inject request: Request
) extends LoggedInRequest

case class GetTblRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @Inject request: Request
) extends LoggedInRequest

case class MultiGetDatabaseRequest(
    @NotEmpty dbNames: Seq[DBName],
    @Inject request: Request
) extends LoggedInRequest

case class PutDBRequest(
    dbSchema: DatabaseSchema,
    @Inject request: Request = null
) extends LoggedInRequest

case class DeleteDBRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @Inject request: Request = null
) extends LoggedInRequest

case class CreateTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @NotEmpty columns: Seq[Column],
    primaryKeys: Seq[String] = Seq.empty,
    orderBys: Seq[String] = Seq.empty,
    @Inject request: Request = null
) extends LoggedInRequest {

  def buildTableSchema() = {
    TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = request.currentOrganizationId.get,
      displayName = tblName,
      columns = columns,
      primaryKeys = Option(primaryKeys).getOrElse(Seq.empty),
      orderBys = Option(orderBys).getOrElse(Seq.empty)
    )
  }
}

case class UpdateTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam tblName: String,
    tableSchema: TableSchema,
    @Inject request: Request = null
) extends LoggedInRequest

case class RenameTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam tblName: String,
    @NotEmpty newName: String,
    @Inject request: Request = null
) extends LoggedInRequest {
  def getNormalizedName: String = newName.toSnakeCase
}

case class GetTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class DeleteTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @Inject request: Request
) extends LoggedInRequest

case class DetectSchemaRequest(properties: Option[Map[String, Any]], records: Option[Seq[String]]) {

  def getPropertiesAsMap(): Map[String, Any] = {
    records match {
      case Some(records) =>
        records.zipWithIndex.map {
          case (v, i) => s"f$i" -> v
        }.toMap
      case _ => properties.getOrElse(Map.empty)
    }
  }
}

case class CreateColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    column: Column,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class UpdateColumnNamesRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    newNames: Seq[String],
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class UpdateColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    column: Column,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class DetectExpressionTypeRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    expression: String,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class DeleteColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") columnName: String,
    @Inject request: Request = null
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class CreateTableFromQueryRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @NotEmpty displayName: String,
    @NotEmpty query: String,
    @JsonScalaEnumeration(classOf[TableTypeRef]) tableType: Option[TableType] = None,
    isOverride: Boolean = false,
    @Inject request: Request = null
) extends LoggedInRequest {
  // Force set table type is normal view
  def getTableType(): TableType = {
    tableType.getOrElse(TableType.View)
  }

  def organizationId: Long = request.currentOrganizationId.get

  def creatorId: String = request.currentUsername

  def toTableFromQueryInfo: TableFromQueryInfo =
    TableFromQueryInfo(
      dbName = dbName,
      tblName = tblName,
      displayName = displayName,
      query = query,
      tableType = getTableType(),
      aliasColumnDisplayNames = Array.empty
    )
}

case class DetectColumnsRequest(@NotEmpty query: String)

case class MigrateDataRequest(orgId: Long, sourceDbUrl: String, secretToken: String)

case class TableFromQueryInfo(
    dbName: String,
    tblName: String,
    displayName: String,
    query: String,
    tableType: TableType,
    aliasColumnDisplayNames: Array[String] = Array.empty,
    ttl: Option[Long] = None
) {

  def applyAliasDisplayNames(columns: Array[Column], displayNames: Array[String]): Array[Column] = {
    columns.zipWithIndex.map(item => {
      val (column: Column, index: Int) = item
      if (index < displayNames.length) {
        column.copyTo(column.name, displayNames(index))
      } else {
        column
      }
    })
  }

  def toTableSchema(organizationId: Long, columns: Array[Column]): TableSchema = {
    val newColumns: Array[Column] = applyAliasDisplayNames(columns, aliasColumnDisplayNames)
    TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = displayName,
      columns = newColumns,
      query = Some(query),
      tableType = Option(tableType),
      ttl = ttl
    )
  }
}

case class DetectAdhocTableSchemaRequest(
    @NotEmpty query: String,
    @Inject request: Request = null
) extends LoggedInRequest {

  val orgId: Long = request.currentOrganizationId.get

  val creatorId: String = request.currentUsername

  def toTableFromQueryInfo: TableFromQueryInfo = {
    TableFromQueryInfo(
      dbName = "",
      tblName = "adhoc_view",
      displayName = "adhoc_view",
      query = query,
      tableType = TableType.View,
      ttl = None,
      aliasColumnDisplayNames = Array.empty
    )
  }
}

case class CreateExprColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    column: Column,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class UpdateExprColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    column: Column,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}

case class DeleteExprColumnRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") columnName: String,
    @Inject request: Request = null
) extends LoggedInRequest {
  def organizationId: Long = request.currentOrganizationId.get
}
