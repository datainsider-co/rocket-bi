package datainsider.jobworker.repository.reader.facebook_ads

import com.facebook.ads.sdk._
import com.google.gson.{JsonElement, JsonObject}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.SyncMode
import datainsider.jobworker.domain.job.FacebookAdsJob
import datainsider.jobworker.exception.ReaderException
import datainsider.jobworker.repository.reader.Reader

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util
import java.util.Date

/**
  *@throws UnsupportedOperationException when tableName of job is not supported
  */
class FacebookAdsReader(job: FacebookAdsJob, apiNodeList: APINodeList[APINode], columns: Seq[Column])
    extends Reader
    with Logging {
  var responseAsIterator: util.Iterator[APINode] = null
  init()

  override protected def init(): Unit = {
    try responseAsIterator = apiNodeList.withAutoPaginationIterator(true).iterator()
    catch {
      case e: Throwable =>
        logger.error(s"FacebookAdsReader::init:: ${e.getMessage}")
        throw new ReaderException("init response as iterator from apiNodeList unsuccessfully", e)
    }
  }

  override def hasNext(): Boolean = {
    responseAsIterator.hasNext
  }

  override def next(columns: Seq[Column]): Record =
    try {
      val facebookAdsData: JsonObject = responseAsIterator.next().getRawResponseAsJsonObject
      if (!isNull(facebookAdsData)) {
        val record = toRecord(facebookAdsData, columns)
        record
      } else null

    } catch {
      case e: NoSuchElementException => throw new ReaderException(message = "when has no more record", cause = e)
    }

  override def detectTableSchema(): TableSchema = {

    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = columns
    )
  }

  override def close(): Unit = Unit

  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = None

  private def toRecord(recordAsJson: JsonObject, columns: Seq[Column]): Array[Any] = {
    columns
      .map(column => {
        if (!isNull(recordAsJson.get(column.name))) {
          parseJsonToColumnType(column, recordAsJson.get(column.name))
        } else {
          null
        }
      })
      .toArray
  }
  private def isNull(record: JsonElement): Boolean =
    record == null || record.isJsonNull

  val formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")

  private def getDataAsDateTime(element: JsonElement): Timestamp = {
    val dataTimeAsMillis = new Date(formatter.parse(element.getAsString).getTime).getTime
    new Timestamp(dataTimeAsMillis)
  }

  private def getDataAsDate(element: JsonElement): Date = formatter.parse(element.getAsString)
  private def getDataAsString(element: JsonElement): String = {
    if (element.isJsonObject || element.isJsonArray)
      element.toString
    else element.getAsString
  }
  private def parseJsonToColumnType(column: Column, element: JsonElement): Any = {

    column match {
      case _: Int8Column     => element.getAsByte
      case _: Int16Column    => element.getAsShort
      case _: Int32Column    => element.getAsInt
      case _: Int64Column    => element.getAsLong
      case _: UInt8Column    => element.getAsByte
      case _: UInt16Column   => element.getAsShort
      case _: UInt32Column   => element.getAsInt
      case _: UInt64Column   => element.getAsLong
      case _: FloatColumn    => element.getAsFloat
      case _: DoubleColumn   => element.getAsDouble
      case _: DateColumn     => getDataAsDate(element)
      case _: DateTimeColumn => getDataAsDateTime(element)
      case _: StringColumn   => getDataAsString(element)
      case _: BoolColumn     => element.getAsBoolean
      case _ =>
        error(s"Column is not supported: $column")
        null
    }
  }

}
