package datainsider.ingestion.controller.http.requests

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{NotEmpty, Pattern}
import datainsider.client.domain.org.Organization
import datainsider.ingestion.domain.SparkDataType._
import datainsider.ingestion.domain.SparkWriteMode.SparkWriteMode
import datainsider.ingestion.domain.TableType.TableType
import datainsider.ingestion.domain._
import datainsider.ingestion.service.GeneratedColumn
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.Implicits.ImplicitString

import javax.inject.Inject

/**
  * @author andy
  * @since 7/17/20
  */

trait IpContextRequest {
  val request: Request

  def clientIp: String = request.headerMap.getOrElse("X-Real-IP", request.remoteHost)
}

trait OrgContextRequest extends IpContextRequest {
  import datainsider.ingestion.controller.http.filter.RequestOrganizationContext.OrganizationContextSyntax

  def organization: Organization = request.currentOrganization

  def organizationId: Long = request.currentOrganization.organizationId
}

case class EnsureSparkSchemaRequest(
    organizationId: Long,
    @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @JsonScalaEnumeration(classOf[SparkWriteModeRef]) writeMode: SparkWriteMode = SparkWriteMode.Append,
    @JsonScalaEnumeration(classOf[TableTypeRef]) tableType: Option[TableType] = None,
    @NotEmpty columns: Seq[SparkColumn],
    primaryKeys: Seq[String] = Seq.empty,
    partitionBy: Seq[String] = Seq.empty,
    orderBys: Seq[String] = Seq.empty,
    @Inject request: Request = null
) {
  def toTableSchema(): TableSchema = {
    TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = tblName,
      columns = toColumns(columns),
      tableType = tableType,
      primaryKeys = primaryKeys,
      partitionBy = partitionBy,
      orderBys = orderBys
    )
  }

  def toColumns(columns: Seq[SparkColumn]): Seq[Column] = {
    columns.map(column =>
      column.dataType match {
        case BooleanType =>
          BoolColumn(column.name, column.name, defaultValue = Some(false), isNullable = column.isNullable)
        case IntegerType =>
          Int32Column(column.name, column.name, defaultValue = Some(0), isNullable = column.isNullable)
        case LongType => Int64Column(column.name, column.name, defaultValue = Some(0L), isNullable = column.isNullable)
        case FloatType =>
          FloatColumn(column.name, column.name, defaultValue = Some(0.0f), isNullable = column.isNullable)
        case DoubleType =>
          DoubleColumn(column.name, column.name, defaultValue = Some(0.0), isNullable = column.isNullable)
        case StringType =>
          StringColumn(column.name, column.name, defaultValue = Some(""), isNullable = column.isNullable)
        case DateType      => DateColumn(column.name, column.name, isNullable = column.isNullable)
        case TimestampType => DateTime64Column(column.name, column.name, isNullable = column.isNullable)
        case ShortType     => Int32Column(column.name, column.name, defaultValue = Some(0), isNullable = column.isNullable)
        case _             => StringColumn(column.name, column.name, defaultValue = Some(""), isNullable = column.isNullable)
      }
    )
  }
}

case class IngestRequest(
    organizationId: Long,
    @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @NotEmpty records: Seq[Map[String, Any]],
    @Inject request: Request = null
) {

  def getDatabaseName() = ClickHouseUtils.buildDatabaseName(organizationId, dbName)

  def getDbDisplayName = dbName.asPrettyDisplayName

  def getAsOneRecord(): Map[String, Any] = {
    records
      .foldLeft(scala.collection.mutable.Map.empty[String, Any])((finalResult, record) => {
        record.foreach { case (k, v) => finalResult.put(k, v) }
        finalResult
      })
      .toMap
  }

}

case class ClearTableRequest(
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @RouteParam @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    @Inject request: Request = null
) extends OrgContextRequest {
  def getDatabaseName() = ClickHouseUtils.buildDatabaseName(organizationId, dbName)
}

case class IngestFakeDataRequest(
    dbName: String,
    tblName: String,
    length: Long,
    tableCols: Array[GeneratedColumn],
    @Inject request: Request = null
)

case class OptimizeTableRequest(
    organizationId: Long,
    @NotEmpty @Pattern(regexp = "\\w+") dbName: String,
    @NotEmpty @Pattern(regexp = "\\w+") tblName: String,
    primaryKeys: Array[String] = Array.empty,
    isUseFinal: Boolean = true
)
