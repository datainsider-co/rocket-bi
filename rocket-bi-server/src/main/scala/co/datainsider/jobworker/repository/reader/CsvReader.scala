package co.datainsider.jobworker.repository.reader

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.domain.CsvConfig
import co.datainsider.jobworker.repository.reader.CsvReader.{detectSchema, parse}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.twitter.inject.Logging
import com.univocity.parsers.common.{ParsingContext, ResultIterator}
import com.univocity.parsers.csv.{CsvFormat, CsvParser, CsvParserSettings}
import org.apache.spark.sql.types._
import org.apache.spark.sql.{Dataset, SparkSession}

import java.io.File
import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.util.Try

object CsvReader extends Logging {

  private val spark = SparkSession.builder().master("local").appName("CsvReader").getOrCreate()

  /***
    * detect datatype and create default table schema, can use option for user optional setting,
    * @param path path to csv file
    * @param setting
    * @return
    */
  def detectSchema(path: String, setting: CsvConfig): TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::detectSchema") {
      import spark.implicits._

      val numSampleLines: Int = 1000
      val sampleLines: Seq[String] = getSampleLines(path, numSampleLines)
      val sampleDataset: Dataset[String] = sampleLines.toDS()

      val df = spark.read
        .format("csv")
        .option("header", setting.includeHeader)
        .option("delimiter", setting.delimiter)
        .option("quote", setting.quote.toString)
        .option("escape", setting.escape.toString)
        .option("inferSchema", "true")
        .csv(sampleDataset)

      val columns: Seq[Column] = df.schema.fields.map(f => {
        val colName: String = f.name
        val colType: DataType = f.dataType

        val dateFormat: Option[String] = if (colType == StringType) {
          val values: Array[String] = df.select(colName).collect().map(r => r.getString(0))
          val detectedDateFormats: Array[String] = values.flatMap(detectDateFormatBestEffort)
          detectedDateFormats.headOption
        } else None

        toColumn(colName, colType, dateFormat)
      })

      TableSchema(name = "", dbName = "", displayName = "", organizationId = -1L, columns = columns)
    }

  /***
    * parse csv lines to correct datatype based on user setting that match with final table schema
    * @param rows 2d array of csv string values
    * @param srcColumns schema of rows
    * @param destColumns schema of destination table, if column of destColumn not found in srcColumn, then that value will have null value
    * @return
    */
  private def parse(rows: Seq[Seq[String]], srcColumns: Seq[Column], destColumns: Seq[Column]): Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::parse") {
      val records: Seq[Record] = rows.map(row => {
        try {
          val valuesMap: Map[String, String] = srcColumns.map(_.name).zip(row).toMap
          val record: Record = toRecord(valuesMap, destColumns)
          record
        } catch {
          case e: Throwable =>
            error(s"${this.getClass.getSimpleName}::parse rows failed: ${e}")
            Array.empty[Any]
        }
      })
      records
    }

  private def getSampleLines(filePath: String, numSample: Int): Seq[String] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getSampleLines") {
      val sampleLines = ArrayBuffer.empty[String]
      Using(Source.fromFile(filePath)) { src =>
        sampleLines ++= src.getLines().take(numSample).toSeq
      }
      sampleLines
    }

  private def toColumn(colName: String, colType: DataType, dateFormat: Option[String]): Column =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::toColumn") {
      if (dateFormat.isDefined) {
        DateTimeColumn(colName, colName, inputFormats = dateFormat.toSeq, isNullable = true)
      } else {
        colType match {
          case IntegerType => Int32Column(colName, colName, isNullable = true)
          case StringType  => StringColumn(colName, colName, isNullable = true)
          case DoubleType  => DoubleColumn(colName, colName, isNullable = true)
          case LongType    => Int64Column(colName, colName, isNullable = true)
          case BooleanType => BoolColumn(colName, colName, isNullable = true)
          case _           => StringColumn(colName, colName, isNullable = true)
        }
      }
    }

  private def toRecord(valuesMap: Map[String, String], destColumns: Seq[Column]): Record = {
    destColumns.map(destCol => {
      try {
        valuesMap.get(destCol.name) match {
          case Some(value) => convertToDestType(destCol, value)
          case None        => null
        }
      } catch {
        case e: Throwable =>
          error(s"${this.getClass.getSimpleName}::toRecord csv failed: ${e}")
          throw e
      }
    }).toArray
  }

  private def convertToDestType(column: Column, valueStr: String): Any = {
    column match {
      case c: Int8Column       => Try(valueStr.toByte).getOrElse(c.defaultValue.getOrElse(null))
      case c: Int16Column      => Try(valueStr.toShort).getOrElse(c.defaultValue.getOrElse(null))
      case c: Int32Column      => Try(valueStr.toInt).getOrElse(c.defaultValue.getOrElse(null))
      case c: Int64Column      => Try(valueStr.toLong).getOrElse(c.defaultValue.getOrElse(null))
      case c: UInt8Column      => Try(valueStr.toShort).getOrElse(c.defaultValue.getOrElse(null))
      case c: UInt16Column     => Try(valueStr.toInt).getOrElse(c.defaultValue.getOrElse(null))
      case c: UInt32Column     => Try(valueStr.toLong).getOrElse(c.defaultValue.getOrElse(null))
      case c: UInt64Column     => Try(valueStr.toLong).getOrElse(c.defaultValue.getOrElse(null))
      case c: FloatColumn      => Try(valueStr.toFloat).getOrElse(c.defaultValue.getOrElse(null))
      case c: DoubleColumn     => Try(valueStr.toDouble).getOrElse(c.defaultValue.getOrElse(null))
      case c: StringColumn     => if (valueStr != null) valueStr else null
      case c: DateColumn       => parseDateStr(valueStr, c.inputFormats).orNull
      case c: DateTimeColumn   => parseDateTimeStr(valueStr, c.inputFormats).orNull
      case c: DateTime64Column => parseDateTime64Str(valueStr, c.inputFormats).getOrElse(null)
      case _                   => valueStr
    }
  }

  private def detectDateFormatBestEffort(value: String): Seq[String] = {
    val commonDateFormats = Seq(
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd",
      "dd/MM/yyyy",
      "dd-MM-yyyy",
      "d/M/yyyy",
      "d/M/yy",
      "dd/MM/yy",
      "yy-M-d",
      "dd-MM-yyyy hh:mm:ss",
      "yyyy-MM-dd'T'HH:mm:ssZ",
      "yyyy-MM-dd'T'HH:mm:ss'Z'",
      "yyyy-MM-dd'T'HH:mm:ssZZ",
      "yyyy-MM-dd'T'HH:mm:ssX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      "HH:mm:ss",
      "HH:mm",
      "mm:ss"
    )

    commonDateFormats.zipWithIndex
      .map {
        case (format, index) =>
          val timestamp = parseDateTimeStr(value, Seq(format))
          if (timestamp.isDefined) commonDateFormats(index) else null
      }
      .filter(_ != null)
  }

  private def parseDateTimeStr(dateStr: String, formats: Seq[String]): Option[Timestamp] = {
    try {
      val formatter = new SimpleDateFormat(formats.head)
      val datetime = formatter.parse(dateStr)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case _: Throwable => None
    }
  }

  private def parseDateTime64Str(dateStr: String, formats: Seq[String]): Option[Long] = {
    try {
      val formatter = new SimpleDateFormat(formats.head)
      val datetime = formatter.parse(dateStr)
      Some(datetime.getTime)
    } catch {
      case _: Throwable => None
    }
  }

  private def parseDateStr(dateStr: String, formats: Seq[String]): Option[Date] = {
    try {
      val formatter = new SimpleDateFormat(formats.head)
      val date = formatter.parse(dateStr)
      Some(new Date(date.getTime))
    } catch {
      case _: Throwable => None
    }
  }
}

class CsvReader(path: String, csvSetting: CsvConfig, batchSize: Int) extends FileReader with Logging {

  private val file = new File(path)
  private var numSkipLines: Int = csvSetting.skipRows + (if (csvSetting.includeHeader) 1 else 0)

  private val csvFormat = new CsvFormat()
  csvFormat.setDelimiter(csvSetting.delimiter)
  csvFormat.setQuote(csvSetting.quote)
  csvFormat.setQuoteEscape(csvSetting.escape)

  private val parserSettings = new CsvParserSettings
  parserSettings.setFormat(csvFormat)

  private val parser = new CsvParser(parserSettings)
  private val recordIterator: ResultIterator[Array[String], ParsingContext] = parser.iterate(file, "UTF-8").iterator

  lazy val csvSchema: TableSchema = detectSchema(path, csvSetting)

  def hasNext(): Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      recordIterator.hasNext
    }

  def next(destSchema: TableSchema): Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {

      try {
        val records = ArrayBuffer[Seq[String]]()
        var cur = 0

        while (numSkipLines > 0) {
          recordIterator.next()
          numSkipLines -= 1
        }

        while (recordIterator.hasNext && cur < batchSize) {
          records += recordIterator.next()
          cur += 1
        }

        parse(records, csvSchema.columns, destSchema.columns)

      } catch {
        case ex: Throwable =>
          logger.error(s"parse csv failed: $ex")
          Seq.empty
      }
    }

  override def detectTableSchema(): TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::detectTableSchema") {
      csvSchema
    }

  override def getFile: File = file

  override def close(): Unit = {}
}
