package datainsider.schema.misc.parser

import com.twitter.inject.Logging
import datainsider.schema.domain.TableSchema
import datainsider.schema.domain.column.{Column, NestedColumn}
import datainsider.schema.misc.JdbcClient.Record
import datainsider.schema.util.Implicits.ImplicitString

/**
  * @author andy
  * @since 7/22/20
  */

object DataParser extends Logging {

  def parseRecord(columns: Seq[Column], data: Seq[Any]): RecordResult = {

    val resultRecord = columns.zip(data).map {
      case (column, data) =>
        try {
          Option(ColumnParser(column).parse(data))
        } catch {
          case ex: Exception =>
            logger.error(s"parseField(${column.name}, $data)", ex)
            None
        }
    }

    val totalInvalidFields = resultRecord.filter(_.isEmpty).size
    val outputRecord: Seq[Any] = resultRecord.map(_.orNull)

    RecordResult(
      if (totalInvalidFields <= 0) Some(outputRecord) else None,
      totalInvalidFields
    )
  }

  case class Result(
      totalRecords: Long,
      totalSkippedRecords: Long,
      totalInvalidRecords: Long,
      totalInvalidFields: Long,
      records: Seq[Record]
  )

  case class RecordResult(record: Option[Record], totalInvalidFields: Long) {
    def isValid = record.isDefined
  }

}

trait DataParser extends Logging {
  def parseArrayRecords(records: Array[Array[Object]]): DataParser.Result

  def parseCSVRecords(records: Seq[Record]): DataParser.Result

  def parseRecord(properties: Map[String, Any]): DataParser.Result

  def parseRecords(properties: Seq[Map[String, Any]]): DataParser.Result
}

case class ClickHouseDataParser(schema: TableSchema) extends DataParser {

  override def parseRecords(properties: Seq[Map[String, Any]]): DataParser.Result = {
    val results = properties.map(parseProperties)
    buildResult(results.size, 0, results)
  }

  private def parseProperties(properties: Map[String, Any]): DataParser.RecordResult = {
    def normalize(properties: Map[String, Any]): Map[String, Any] = {
      properties.map { case (k, v) => k.toSnakeCase -> v }
    }

    val columns: Seq[Column] = dropMaterializedColumns(schema.columns)
    val normalizeProperties: Map[String, Any] = normalize(properties)

    val values = columns.map {
      case column: NestedColumn => collectNestedColumnValues(column, normalizeProperties)
      case column               => normalizeProperties.getOrElse(column.name, null)
    }
    DataParser.parseRecord(columns, values)
  }

  private def collectNestedColumnValues(column: NestedColumn, properties: Map[String, Any]): Any = {
    if (properties.contains(column.name)) {
      properties.get(column.name).orNull
    } else {
      column.nestedColumns.map(column => properties.get(column.name).orNull)
    }
  }

  /***
    * return 1 row of data that match with table schema from given json data
    */
  override def parseRecord(properties: Map[String, Any]): DataParser.Result = {
    val result: DataParser.RecordResult = parseProperties(properties)
    buildResult(1, 0, Seq(result))
  }

  override def parseCSVRecords(records: Seq[Record]): DataParser.Result = {
    val columns = dropMaterializedColumns(schema.columns)
    val inputRecords = records.filter(_.size >= columns.size)
    val totalRecords = records.size
    val totalSkippedRecords = totalRecords - inputRecords.size

    val results = inputRecords
      .map(_.take(columns.size))
      .map(DataParser.parseRecord(columns, _))

    buildResult(
      totalRecords,
      totalSkippedRecords,
      results
    )

  }

  private def dropMaterializedColumns(columns: Seq[Column]): Seq[Column] = {
    columns.filterNot(_.isMaterialized())
  }

  private def buildResult(
      totalRecords: Long,
      totalSkippedRecords: Long,
      results: Seq[DataParser.RecordResult]
  ): DataParser.Result = {

    val (invalidRecords, invalidFields) = getInvalidFieldAndRecords(results)
    DataParser.Result(
      totalRecords,
      totalSkippedRecords,
      invalidRecords,
      invalidFields,
      results.filter(_.isValid).map(_.record.get)
    )
  }

  private def getInvalidFieldAndRecords(resultList: Seq[DataParser.RecordResult]) = {
    resultList.foldLeft((0L, 0L))((r, item) => {
      (
        r._1 + (if (item.isValid) 0L else 1L),
        r._2 + item.totalInvalidFields
      )
    })
  }

  override def parseArrayRecords(records: Array[Array[Object]]): DataParser.Result = {
    val columns = dropMaterializedColumns(schema.columns)
    val inputRecords = records.filter(_.length >= columns.size)
    val totalRecords = records.length
    val totalSkippedRecords = totalRecords - inputRecords.length

    val results = inputRecords
      .map(_.take(columns.size))
      .map(DataParser.parseRecord(columns, _))

    buildResult(
      totalRecords,
      totalSkippedRecords,
      results
    )
  }

}
