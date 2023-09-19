package co.datainsider.jobworker.service.hubspot.client

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.domain.HubspotJob
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{Column, DateTimeColumn, DoubleColumn, StringColumn}
import datainsider.client.exception.InternalError

import java.sql.Timestamp
import java.text.SimpleDateFormat
import scala.util.Try

class HubspotReader(privateAppKey: String, job: HubspotJob)
    extends APIKeyHubspotClient(privateAppKey)
    with HsPropertiesClient {
  private val baseObjectsUrl = s"$apiUrl/crm/v3/objects/${job.subType.toString}"

  private var nextPage: Option[HsPaging] = None
  private val pageSize = 100

  def getSchema: TableSchema = {
    val resp = getProperties(job.subType)
    if (resp.isSuccess) {
      toTableSchema(resp.data.get)
    } else throw InternalError(s"Fail to get hubspot properties schema. Code: ${resp.code}, reason: ${resp.error}")
  }

  def hasNext(): Boolean = {
    nextPage.isDefined
  }

  def next(columns: Seq[Column]): Seq[Record] = {
    list(pageSize, nextPage.map(_.next.after)).map(resp => toRecord(resp, columns))
  }

  private def list(limit: Int, after: Option[String]): Seq[HsPropertiesResponse] = {
    val afterParam = if (after.isDefined) s"&after=${after.get}" else ""
    val pageParams = s"?limit=$limit$afterParam"

    val resp: Response[HsPageResponse[HsPropertiesResponse]] =
      http.GET[HsPageResponse[HsPropertiesResponse]](baseObjectsUrl + pageParams)

    if (resp.isSuccess) {
      val pageResp = resp.data.get
      nextPage = pageResp.paging
      pageResp.results
    } else throw InternalError(s"Fail to get hubspot properties objects. Code: ${resp.code}, reason: ${resp.error}")
  }

  private def toRecord(resp: HsPropertiesResponse, columns: Seq[Column]): Record = {
    columns.map {
      case c: DoubleColumn   => toDouble(resp.properties.getOrElse(c.name, null)).getOrElse(null)
      case c: DateTimeColumn => toDateTime(resp.properties.getOrElse(c.name, null)).getOrElse(null)
      case c: StringColumn   => resp.properties.getOrElse(c.name, null)
      case _ @c              => resp.properties.getOrElse(c.name, null)
    }.toArray
  }

  private def toTableSchema(pageResp: HsPageResponse[HsPropertyInfo]): TableSchema = {
    val columns: Seq[Column] = pageResp.results.map(col => {
      col.`type` match {
        case "number"   => DoubleColumn(col.name, col.label)
        case "string"   => StringColumn(col.name, col.label)
        case "datetime" => DateTimeColumn(col.name, col.label)
        case _          => StringColumn(col.name, col.label)
      }
    })

    TableSchema(
      organizationId = job.orgId,
      dbName = job.destDatabaseName,
      name = "contacts",
      displayName = "contacts",
      columns = columns
    )
  }

  private def toDouble(value: String): Option[Double] = {
    Try(value.toDouble).toOption
  }

  private def toDateTime(value: String): Option[Timestamp] = {
    try {
      val formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")
      val datetime = formatter.parse(value)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case e: Throwable => None
    }
  }

}
