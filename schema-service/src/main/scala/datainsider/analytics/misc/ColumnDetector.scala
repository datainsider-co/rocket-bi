package datainsider.analytics.misc

import datainsider.ingestion.domain._
import datainsider.ingestion.util.Implicits.ImplicitString

import java.sql.Types

object ColumnDetector {

  case class RawColumnData(name: String, displayName: String, idType: Int, isNullable: Boolean)

  case class DetectionResult(columns: Seq[Column], unknownColumns: Seq[Column])

  def normalizeProperties(properties: Map[String, Any]): Map[String, Any] = {
    properties
      .filter(_._1 != null)
      .map { case (k, v) => formatAsFieldName(k) -> v }
  }

  def detectColumns(properties: Map[String, Any], displayNameMap: Option[Map[String, String]] = None): Seq[Column] = {

    val nameMap = displayNameMap.getOrElse(Map.empty)
    properties.map {
      case (k, v) =>
        val name = k.toSnakeCase
        val displayName = nameMap.getOrElse(k, name.asPrettyDisplayName)
        createColumn(name, displayName, v)
    }.toSeq
  }

  private def createColumn(name: String, displayName: String, value: Any): Column = {
    value match {
      case _: Boolean       => BoolColumn(name, displayName, defaultValue = Some(false), isNullable = true)
      case _: Int           => Int32Column(name, displayName, defaultValue = Some(0), isNullable = true)
      case _: Long          => Int64Column(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: Float         => FloatColumn(name, displayName, defaultValue = Some(0.0f), isNullable = true)
      case _: Double        => DoubleColumn(name, displayName, defaultValue = Some(0.0), isNullable = true)
      case _: String        => StringColumn(name, displayName, defaultValue = Some(""), isNullable = true)
      case _: java.sql.Date => DateColumn(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: java.sql.Timestamp =>
        DateTime64Column(name, displayName, defaultValue = Some(0L), isNullable = true)
      case array: Seq[_]         => createArrayColumn(name, displayName, array)
      case array: Array[AnyRef]  => createArrayColumn(name, displayName, array)
      case map: Map[String, Any] => createNestedColumn(name, displayName, map)
      case _                     => StringColumn(name, displayName, defaultValue = Some(""), isNullable = true)
    }
  }

  private def createArrayColumn(name: String, displayName: String, data: Seq[Any]): ArrayColumn = {
    data.headOption match {
      case Some(x: Boolean)            => ArrayColumn(name, displayName, column = BoolColumn(name, displayName))
      case Some(x: Int)                => ArrayColumn(name, displayName, column = Int32Column(name, displayName))
      case Some(x: Long)               => ArrayColumn(name, displayName, column = Int64Column(name, displayName))
      case Some(x: Float)              => ArrayColumn(name, displayName, column = FloatColumn(name, displayName))
      case Some(x: Double)             => ArrayColumn(name, displayName, column = DoubleColumn(name, displayName))
      case Some(x: String)             => ArrayColumn(name, displayName, column = StringColumn(name, displayName))
      case Some(x: java.sql.Date)      => ArrayColumn(name, displayName, column = DateColumn(name, displayName))
      case Some(x: java.sql.Timestamp) => ArrayColumn(name, displayName, column = DateTime64Column(name, displayName))
      case _                           => ArrayColumn(name, displayName, column = StringColumn(name, displayName))
    }
  }

  private def createNestedColumn(name: String, displayName: String, properties: Map[String, Any]): NestedColumn = {
    val columns = detectColumns(properties)
    NestedColumn(
      name = name,
      displayName = displayName,
      description = None,
      nestedColumns = columns,
      isNullable = true
    )
  }

  /**
    * Format the given `name` as a valid field's name following the following rules
    *
    * 1. Lowercase only
    *
    * 2. Single line
    *
    * 3. No space character
    *
    * 1 or multiple-space characters will be replace as a single `_` char.
    *
    * 1 or multiple `_` -> as a single `_`
    * @param name
    * @return
    */
  def formatAsFieldName(name: String): String = {
    name
      .trim()
      .toLowerCase()
      .replaceAll("\\n", "_")
      .replaceAll("\\r", "_")
      .replaceAll("\\s+", "_")
      .replaceAll("_+", "_")
  }

  /**
    * Return Column with idType, throw exception if idType unsupported
    * @param columnData
    * @return
    */
  def createColumn(columnData: RawColumnData): Column = {
    columnData.idType match {
      case Types.BIT | Types.BOOLEAN =>
        BoolColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.TINYINT  => Int8Column(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.SMALLINT => Int16Column(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.INTEGER  => Int32Column(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.BIGINT   => Int64Column(columnData.name, columnData.displayName, isNullable = columnData.isNullable)

      case Types.FLOAT   => FloatColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.REAL    => DoubleColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.DOUBLE  => DoubleColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.NUMERIC => DoubleColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.DECIMAL => DoubleColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)

      case Types.DATE => DateColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.TIME => DateTimeColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.TIMESTAMP =>
        DateTimeColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)

      case Types.NVARCHAR => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.LONGNVARCHAR =>
        StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.CHAR    => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.VARCHAR => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.LONGVARCHAR =>
        StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.NCHAR => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.ARRAY => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)

      case _ => throw new UnsupportedOperationException(s"column id: ${columnData.idType} unsupported")
    }
  }
}
