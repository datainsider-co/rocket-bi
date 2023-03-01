package datainsider.jobworker.repository.reader

import com.mongodb.MongoClient
import com.mongodb.client.MongoCursor
import com.mongodb.client.model.{Filters, Sorts}
import com.twitter.inject.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.util.ZConfig
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.{MongoJob, MongoSource, SyncMode}
import datainsider.jobworker.util.JsonUtils
import datainsider.jobworker.util.MongoSupportUtils.buildMongoClient
import jdk.nashorn.internal.ir.debug.ObjectSizeCalculator
import org.bson.Document

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util
import scala.collection.mutable.ArrayBuffer

object MongoReader extends Logging {
  def apply(dataSource: MongoSource, job: MongoJob): MongoReader = {
    val client = buildMongoClient(dataSource)
    job.syncMode match {
      case SyncMode.FullSync =>
        new SimpleMongoReader(job.orgId, client, job.databaseName, job.tableName, job.flattenDepth)
      case SyncMode.IncrementalSync =>
        new IncrementalMongoReader(
          job.orgId,
          client,
          job.databaseName,
          job.tableName,
          job.incrementalColumn.get,
          job.lastSyncedValue,
          job.flattenDepth
        )
    }
  }
}

trait MongoReader {

  def getTotal: Long

  def hasNext: Boolean

  def getNextRecords(columns: Seq[Column]): Seq[Record]

  def getTableSchema: TableSchema

  def cleanUp(): Unit
}

class SimpleMongoReader(
    organizationId: Long,
    client: MongoClient,
    dbName: String,
    collection: String,
    flattenDepth: Int
) extends BaseMongoReader(
      organizationId = organizationId,
      client = client,
      dbName = dbName,
      collection = collection,
      flattenDepth
    )
    with MongoReader {

  val cursor: MongoCursor[Document] = client.getDatabase(dbName).getCollection(collection).find().iterator()

  info(s"memory cursor use: ${ObjectSizeCalculator.getObjectSize(cursor)}")
  info(s"memory client use: ${ObjectSizeCalculator.getObjectSize(client)}")
  info(s"memory table schema use: ${ObjectSizeCalculator.getObjectSize(getTableSchema)}")

  override def getTotal: Long = {
    client.getDatabase(dbName).getCollection(collection).countDocuments()
  }

  override def getNextRecords(columns: Seq[Column]): Seq[Record] = {
    toRecords(cursor, columns)
  }

  override def hasNext: Boolean = cursor.hasNext

  override def cleanUp(): Unit = {
    cursor.close()
    client.close()
  }
}

class IncrementalMongoReader(
    organizationId: Long,
    client: MongoClient,
    dbName: String,
    collection: String,
    incrementalColumn: String,
    lastSyncedValue: String,
    flattenDepth: Int
) extends BaseMongoReader(
      organizationId = organizationId,
      client = client,
      dbName = dbName,
      collection = collection,
      flattenDepth
    )
    with MongoReader {

  val cursor: MongoCursor[Document] = client
    .getDatabase(dbName)
    .getCollection(collection)
    .find(Filters.gt(incrementalColumn, lastSyncedValue.toDouble))
    .sort(Sorts.ascending(incrementalColumn))
    .iterator()

  override def getTotal: Long = {
    client
      .getDatabase(dbName)
      .getCollection(collection)
      .countDocuments(Filters.gt(incrementalColumn, lastSyncedValue.toDouble))
  }

  override def getNextRecords(columns: Seq[Column]): Seq[Record] = {
    toRecords(cursor, columns)
  }

  override def hasNext: Boolean = cursor.hasNext

  override def cleanUp(): Unit = {
    cursor.close()
    client.close()
  }
}

class BaseMongoReader(organizationId: Long, client: MongoClient, dbName: String, collection: String, flattenDepth: Int)
    extends Logging {

  val batchSize: Int = ZConfig.getInt("sync_batch_size", default = 1000)
  val delimiter: String = ZConfig.getString("mongodb.default_delimiter", default = ".") // Todo: get from job info

  protected def toRecords(cursor: MongoCursor[Document], columns: Seq[Column]): Seq[Record] = {
    val records = ArrayBuffer.empty[Record]
    while (cursor.hasNext && (records.length < batchSize)) {
      val document = cursor.next()
      val record: Seq[Any] = columns.map(column => {
        parseData(document, column.name, column)
      })
      records += record
    }
    records
  }

  private def parseData(document: Document, key: String, column: Column): Any = {
    if (!key.contains(delimiter)) {
      try {
        column match {
          case _: Int32Column    => document.getInteger(key)
          case _: DoubleColumn   => document.get(key)
          case _: StringColumn   => parseStringData(key, document).orNull
          case _: Int64Column    => document.get(key).toString.toLong
          case _: BoolColumn     => document.getBoolean(key)
          case _: DateTimeColumn => new Timestamp(document.getDate(key).getTime)
          case _: FloatColumn    => document.get(key)
          case c: DateColumn     => convertToDate(document.getString(key), c.inputFormats)
          case _ =>
            error(s"Column is not supported: $column")
            null
        }
      } catch {
        case _: Throwable => null
      }
    } else {
      val delimiterIndex: Int = key.indexOf(".")
      val prefix = key.substring(0, delimiterIndex)
      val suffix = key.substring(delimiterIndex + 1)
      try {
        parseData(document.get[Document](prefix, classOf[Document]), suffix, column)
      } catch {
        case _: Throwable => null
      }
    }
  }

  private def parseStringData(key: String, document: Document): Option[String] = {
    try {
      val columnType = document.get(key).getClass
      if (isBsonDocument(columnType)) {
        Some(document.get[Document](key, classOf[Document]).toJson())
      } else if (isArrayList(columnType)) {
        val data: util.List[Object] = document.getList[Object](key, classOf[Object])
        Some(parseArrayData(data))
      } else {
        Some(document.get(key).toString)
      }
    } catch {
      case _: Throwable => None
    }
  }

  private def parseArrayData(data: util.List[Object]): String = {
    val arrayString = ArrayBuffer.empty[String]
    data.forEach(item => {
      val stringData = item.getClass match {
        case fieldType if isBsonDocument(fieldType) => item.asInstanceOf[Document].toJson()
        case fieldType if isObjectId(fieldType) => item.toString
        case _ => item.toString
      }
      arrayString += stringData
    })
    JsonUtils.toJson(arrayString)
  }

  private def convertToDate(value: String, formats: Seq[String]): Option[Date] = {
    try {
      val format: String = if (formats.nonEmpty) {
        formats.head
      } else {
        "yyyy-MM-dd"
      }
      val formatter = new SimpleDateFormat(format)
      val date = new Date(formatter.parse(value).getTime)
      Some(date)
    } catch {
      case _: Throwable => None
    }
  }

  def getTableSchema: TableSchema = {
    val numberSampleData: Int = ZConfig.getInt("mongodb.number_sample_data", default = 10)
    val sampleDataCursor: MongoCursor[Document] =
      client
        .getDatabase(dbName)
        .getCollection(collection)
        .find()
        .sort(Sorts.descending("$natural"))
        .limit(numberSampleData)
        .iterator()
    val columns = ArrayBuffer.empty[Column]
    while (sampleDataCursor.hasNext) {
      val document = sampleDataCursor.next()
      getNonExistColumns(columns, document).foreach(column => columns += column)
    }
    sampleDataCursor.close()
    TableSchema(
      name = collection,
      dbName = dbName,
      organizationId = organizationId,
      displayName = collection,
      columns = columns
    )
  }

  private def getNonExistColumns(existedColumns: Seq[Column], document: Document): Seq[Column] = {
    val remainingFlattenLvl: Int = flattenDepth
    getColumns(columnNamePrefix = "", document= document, remainingFlattenLvl).filter(column => {
      !existedColumns.exists(_.name.equals(column.name))
    })
  }

  private def getColumns(columnNamePrefix: String, document: Document, remainingFlattenLvl: Int): Seq[Column] = {
    val columns = ArrayBuffer.empty[Column]
    if (remainingFlattenLvl < 1) {
      document
        .keySet()
        .forEach(key => {
          val field: Object = document.get(key)
          if (field != null) {
            val fieldType = field.getClass
            val column: Column = detectColumn(fieldType, columnNamePrefix + key)
            columns += column
          }
        })
    } else {
      document
        .keySet()
        .forEach(key => {
          val field: Object = document.get(key)
          if (field != null) {
            val fieldType = field.getClass
            if (isBsonDocument(fieldType)) {
              getColumns(columnNamePrefix + key + delimiter, document.get[Document](key, classOf[Document]), remainingFlattenLvl - 1)
                .foreach(column => columns += column)
            } else {
              val column: Column = detectColumn(fieldType, columnNamePrefix + key)
              columns += column
            }
          }
        })
    }

    columns
  }

  private def detectColumn(fieldType: Class[_], fieldName: String): Column = {
    fieldType match {
      case fieldType if isString(fieldType)  => StringColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case fieldType if isBoolean(fieldType) => BoolColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case fieldType if isInteger(fieldType) => Int64Column(name = fieldName, displayName = fieldName, isNullable = true)
      case fieldType if isDouble(fieldType)  => DoubleColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case fieldType if isDateColumn(fieldType) =>
        DateTimeColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case _                 => StringColumn(name = fieldName, displayName = fieldName, isNullable = true)
    }
  }

  private def isString(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.lang.String" => true
      case _                  => false
    }
  }

  private def isBoolean(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.lang.Bool" => true
      case _                => false
    }
  }

  private def isInteger(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.lang.Integer"         => true
      case "java.lang.Long"            => true
      case "org.bson.types.Decimal128" => true
      case _                           => false
    }
  }

  private def isDouble(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.lang.Float"   => true
      case "java.lang.Double"  => true
      case _                   => false
    }
  }

  private def isBsonDocument(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "org.bson.Document" => true
      case _                   => false
    }
  }

  private def isArrayList(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.util.ArrayList" => true
      case _                     => false
    }
  }

  private def isDateColumn(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "java.util.Date" => true
      case _                => false
    }
  }

  private def isObjectId(colType: Class[_]): Boolean = {
    colType.getTypeName match {
      case "org.bson.types.ObjectId" => true
      case _                         => false
    }
  }
}
