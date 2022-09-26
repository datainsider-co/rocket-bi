package datainsider.ingestion.service

import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.JdbcClient.Record
import net.tixxit.delimited.{DelimitedFormat, DelimitedParser}
import org.apache.spark.sql.{Dataset, SparkSession}

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat

object CsvReader {

  case class DetectDatetimeFormatResult(datetimeFormat: String, isDatetime64: Boolean, example: Option[String] = None)

  private val spark: SparkSession =
    SparkSession.builder().master("local").appName("ingest-service").getOrCreate()

  /***
    * detect datatype and create default table schema, can use option for user optional setting,
    * @param sample
    * @param setting
    * @return
    */
  def detectSchema(sample: String, setting: CsvSetting): Future[TableSchema] =
    Future {
      import spark.implicits._
      val csvData: Dataset[String] = spark.sparkContext.parallelize(sample.lines.toList).toDS()

      val df = spark.read
        .format("csv")
        .option("header", setting.includeHeader)
        .option("delimiter", setting.delimiter)
        .option("inferSchema", "true")
        .csv(csvData)

      val columns: Seq[Column] = df.schema.fields.map(f => {
        val colName = f.name
        val colType = f.dataType.simpleString
        toColumn(colName, colType)
      })
      val records: Seq[Seq[String]] = parseStringData(sample, setting)
      val finalColumns: Seq[Column] = detectDateColumn(records, columns)
      TableSchema(name = "", dbName = "", displayName = "", organizationId = 0L, columns = finalColumns)
    }

  private def parseStringData(linesAsString: String, setting: CsvSetting): Seq[Seq[String]] = {
    val stringDataLines: String =
      if (setting.includeHeader) linesAsString.lines.drop(1).mkString("\n") else linesAsString
    val format = DelimitedFormat(
      quote = "\"",
      separator = setting.delimiter
    )
    val parser: DelimitedParser = DelimitedParser(format)

    parser
      .parseString(stringDataLines)
      .map {
        case Right(row) => row.iterator.toSeq
        case Left(_)    => Seq.empty
      }
      .filter(_.nonEmpty)

  }

  private def toColumn(colName: String, colType: String): Column = {
    colType match {
      case "int"     => Int32Column(colName, colName, isNullable = true)
      case "string"  => StringColumn(colName, colName, isNullable = true)
      case "double"  => DoubleColumn(colName, colName, isNullable = true)
      case "bigint"  => Int64Column(colName, colName, isNullable = true)
      case "boolean" => BoolColumn(colName, colName, isNullable = true)
      case _         => StringColumn(colName, colName, isNullable = true)
    }
  }

  /***
    * parse csv lines to correct datatype based on user setting that match with final table schema
    * @param lines
    * @param columns
    * @return
    */
  def parse(lines: String, columns: Seq[Column], csvSetting: CsvSetting): Future[Seq[Record]] =
    Future {
      val format = DelimitedFormat(
        quote = "\"",
        separator = csvSetting.delimiter
      )
      val parser: DelimitedParser = DelimitedParser(format)

      try {
        parser
          .parseString(lines)
          .map {
            case Right(row) => toRecord(row.iterator.toSeq, columns)
            case Left(_)    => Seq.empty
          }
          .filterNot(row => row.isEmpty || row.forall(_ == null))
      } catch {
        case e: Throwable =>
          throw BadRequestError("unable to parse the file with current config, please try again with another config")
      }
    }

  def detectDateColumn(records: Seq[Seq[String]], columns: Seq[Column]): Seq[Column] = {

    val finalDateFormats: Seq[DetectDatetimeFormatResult] = records
      .map(record => parseDateFormatBestEffort(record, columns))
      .transpose
      .map(dateFormatResults => dateFormatResults.filter(_ != null))
      .map(dateFormatResults => {
        if (dateFormatResults.nonEmpty) {
          DetectDatetimeFormatResult(dateFormatResults.head.datetimeFormat, dateFormatResults.exists(_.isDatetime64))
        } else null
      })

    columns.zip(finalDateFormats).map {
      case (column, detectedDateFormat) =>
        if (column.isInstanceOf[StringColumn] && detectedDateFormat != null) {
          if (detectedDateFormat.isDatetime64) {
            DateTime64Column(
              column.name,
              column.displayName,
              isNullable = true,
              inputFormats = Seq(detectedDateFormat.datetimeFormat)
            )
          } else {
            DateTimeColumn(
              column.name,
              column.displayName,
              isNullable = true,
              inputFormats = Seq(detectedDateFormat.datetimeFormat)
            )
          }
        } else column
    }
  }

  private def parseDateFormatBestEffort(
      stringValues: Seq[String],
      columns: Seq[Column]
  ): Seq[DetectDatetimeFormatResult] = {
    val record: Seq[String] = stringValues ++ List.fill(columns.length - stringValues.length)(null)
    record.zip(columns).map {
      case (strValue: String, col: StringColumn) =>
        val detectedFormats: Seq[DetectDatetimeFormatResult] = detectDateFormat(strValue)
        if (detectedFormats.nonEmpty) detectedFormats.head
        else null
      case _ => null
    }
  }

  private def toRecord(row: Seq[String], columns: Seq[Column]): Record = {
    val record: Seq[String] = row ++ Seq.fill(columns.length - row.length)(null)
    record.zip(columns).map {
      case (valueStr, column) =>
        try {
          if (valueStr == null) null
          else {
            column match {
              case c: Int32Column      => convertToInt(valueStr).getOrElse(c.defaultValue.getOrElse(null))
              case c: DoubleColumn     => convertToDouble(valueStr).getOrElse(c.defaultValue.getOrElse(null))
              case c: StringColumn     => if (valueStr.nonEmpty) valueStr else c.defaultValue.getOrElse(null)
              case c: Int64Column      => convertToLong(valueStr).getOrElse(c.defaultValue.getOrElse(null))
              case c: BoolColumn       => convertToBoolean(valueStr).getOrElse(c.defaultValue.getOrElse(null))
              case c: DateColumn       => parseDateStr(valueStr, c.inputFormats).orNull
              case c: DateTimeColumn   => parseDateTimeStr(valueStr, c.inputFormats).orNull
              case c: DateTime64Column => parseDateTimeStr(valueStr, c.inputFormats).orNull
              case _                   => valueStr.trim
            }
          }
        } catch {
          case _: Throwable => throw BadRequestError(s"unable to parse row: ${row.mkString(", ")}")
        }
    }
  }

  private def convertToInt(value: String): Option[Int] = {
    try {
      Some(value.toInt)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToLong(value: String): Option[Long] = {
    try {
      Some(value.toLong)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToDouble(value: String): Option[Double] = {
    try {
      Some(value.toDouble)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToBoolean(value: String): Option[Boolean] = {
    try {
      Some(value.toBoolean)
    } catch {
      case _: Throwable => None
    }
  }

  private def detectDateFormat(dateStr: String): Seq[DetectDatetimeFormatResult] = {
    val commonDateFormats = Seq(
      "dd/MM/yyyy hh:mm aa",
      "d/M/yyyy hh:mm aa",
      "d/M/yy h:m a",
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd",
      "dd/MM/yyyy",
      "dd-MM-yyyy",
      "d/M/yyyy",
      "d/M/yy",
      "dd/MM/yy h:m a",
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
          val timestamp: Option[Timestamp] = parseDateTimeStr(dateStr, Seq(format))
          if (timestamp.isDefined) DetectDatetimeFormatResult(commonDateFormats(index), isDatetime64(timestamp.get))
          else null
      }
      .filter(_ != null)
  }

  private def isDatetime64(ts: Timestamp): Boolean = {
    val datetime32MinTs = Timestamp.valueOf("1970-01-01 00:00:00")
    val datetime32MaxTs = Timestamp.valueOf("2100-01-01 00:00:00")
    !(ts.compareTo(datetime32MinTs) > 0 && ts.compareTo(datetime32MaxTs) < 0)
  }

  private def parseDateTimeStr(stringValue: String, patterns: Seq[String]): Option[Timestamp] = {
    try {
      // fast terminate if is not date string
      if (!isDateStr(stringValue)) return None

      val formatter = new SimpleDateFormat(patterns.head)
      val datetime = formatter.parse(stringValue.trim)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case e: Throwable => None
    }
  }

  private def isDateStr(stringValue: String): Boolean = {
    if (stringValue.isEmpty) {
      false
    } else if ("""[\d\-\/: ]+([APMapm]{2})?$""".r.findFirstMatchIn(stringValue).isDefined) {
      true
    } else {
      false
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
