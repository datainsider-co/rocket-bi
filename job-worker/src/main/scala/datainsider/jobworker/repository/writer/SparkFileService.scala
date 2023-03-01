package datainsider.jobworker.repository.writer

import com.ptl.util.JsonUtil
import com.twitter.inject.Logging
import com.typesafe.config.Config
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.exception.UnsupportedError
import datainsider.client.util.Using
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.util.{JsonUtils, ZConfig}
import org.apache.spark.sql.types._
import org.apache.spark.sql.{DataFrame, Row, SaveMode, SparkSession}

import java.io.{BufferedReader, File, FileReader}
import java.util.concurrent.{LinkedBlockingQueue, TimeUnit}
import javax.inject.Inject
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.io.Source
import scala.util.Try
import scala.util.control.NonFatal

trait SparkFileService {
  def writeParquet(fileName: String, tableSchema: TableSchema, rows: Seq[Seq[Any]]): Unit
}

class SparkFileServiceImpl @Inject() (config: Config) extends SparkFileService with Logging {
  private val spark = SparkSession
    .builder()
    .appName(config.getString("app_name"))
    .master(config.getString("master"))
    .getOrCreate()

  private val fsPath = config.getString("file_system")
  private val numPartitions = config.getInt("num_partitions")

  spark.sparkContext.hadoopConfiguration.set("mapreduce.fileoutputcommitter.marksuccessfuljobs", "false")
  spark.sparkContext.hadoopConfiguration.set("fs.defaultFS", fsPath)

  override def writeParquet(destPath: String, tableSchema: TableSchema, rows: Seq[Seq[Any]]): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::writeParquet") {

      val df: DataFrame = dataFrameFromRows(tableSchema, rows)

      val totalRows = df.count()

      df.repartition(numPartitions)
        .write
        .mode(SaveMode.Append)
        .parquet(fsPath + destPath)

      info(s"Wrote $totalRows records to $destPath")
    }

  private def dataFrameFromRows(schema: TableSchema, rows: Seq[Seq[Any]]): DataFrame =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::dataFrameFromRows") {
      var fields: Seq[StructField] = Seq()

      schema.columns
        .foreach(col => fields :+= StructField(normalizeColumnName(col.name), col.structType, col.isNullable))

      val sparkRows: Seq[Row] = rows.map(row => {
        val values: Seq[Any] = row.zip(schema.columns).map {
          case (value, column) => column.parseValueFromString(Try(value.toString).getOrElse(null))
        }
        Row(values: _*)
      })

      spark.createDataFrame(
        spark.sparkContext.parallelize(sparkRows),
        StructType(fields)
      )
    }

  private def normalizeColumnName(columnName: String): String = {
    columnName.replaceAll("[^a-zA-Z0-9]+","_")
  }

  implicit class ColumnLike(col: Column) {

    def structType: DataType = toSparkDataType(col)

    def toSparkDataType(col: Column): DataType = {
      col match {
        case _: BoolColumn       => BooleanType
        case _: Int8Column       => ByteType
        case _: Int16Column      => ShortType
        case _: Int32Column      => IntegerType
        case _: Int64Column      => LongType
        case _: UInt8Column      => ByteType
        case _: UInt16Column     => ShortType
        case _: UInt32Column     => IntegerType
        case _: UInt64Column     => LongType
        case _: FloatColumn      => FloatType
        case _: DoubleColumn     => DoubleType
        case _: StringColumn     => StringType
        case _: DateColumn       => LongType
        case _: DateTimeColumn   => LongType
        case _: DateTime64Column => LongType
        case c: ArrayColumn      => ArrayType(toSparkDataType(c.column))
        case c: NestedColumn     => ???
        case _ =>
          throw UnsupportedError(
            s"This column type isn't supported: ${col.getClass.getName}"
          )
      }
    }

    def parseValueFromString(value: String): Any = {
      col match {
        case _: BoolColumn       => Try(value.toBoolean).getOrElse(false)
        case _: Int8Column       => Try(value.toByte).getOrElse(0.toByte)
        case _: Int16Column      => Try(value.toShort).getOrElse(0.toShort)
        case _: Int32Column      => Try(value.toInt).getOrElse(0)
        case _: Int64Column      => Try(value.toLong).getOrElse(0L)
        case _: UInt8Column      => Try(value.toByte).getOrElse(0.toByte)
        case _: UInt16Column     => Try(value.toShort).getOrElse(0.toShort)
        case _: UInt32Column     => Try(value.toInt).getOrElse(0)
        case _: UInt64Column     => Try(value.toLong).getOrElse(0L)
        case _: FloatColumn      => Try(value.toFloat).getOrElse(0.0.toFloat)
        case _: DoubleColumn     => Try(value.toDouble).getOrElse(0.0)
        case _: StringColumn     => if (value != null) value else ""
        case _: DateColumn       => Try(value.toLong).getOrElse(0L)
        case _: DateTimeColumn   => Try(value.toLong).getOrElse(0L)
        case _: DateTime64Column => Try(value.toLong).getOrElse(0L)
        case c: ArrayColumn      => ???
        case c: NestedColumn     => ???
        case _ =>
          throw UnsupportedError(
            s"This column type isn't supported: ${col.getClass.getName}"
          )
      }
    }
  }
}
