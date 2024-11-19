package co.datainsider.schema.misc

import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.bi.util.TimeUtils
import co.datainsider.schema.domain.column._

import java.sql.Types

object ColumnDetector {

  case class RawColumnData(name: String, displayName: String, idType: Int, isNullable: Boolean)

  case class DetectionResult(columns: Seq[Column], unknownColumns: Seq[Column])

  def detectColumns(
      properties: Map[String, Any],
      displayNameMap: Option[Map[String, String]] = None
  ): Seq[Column] = {
    val nameMap = displayNameMap.getOrElse(Map.empty)
    properties.map {
      case (k, v) =>
        val name = k.toSnakeCase
        val displayName = nameMap.getOrElse(k, name.asPrettyDisplayName)
        detectColumnByValue(name, displayName, v)
    }.toSeq
  }

  def detectColumnByValue(name: String, displayName: String, value: Any): Column = {
    value match {
      case _: Boolean            => BoolColumn(name, displayName, defaultValue = Some(false), isNullable = true)
      case _: Int                => Int64Column(name, displayName, defaultValue = Some(0), isNullable = true)
      case _: Long               => Int64Column(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: Float              => FloatColumn(name, displayName, defaultValue = Some(0.0f), isNullable = true)
      case _: Double             => DoubleColumn(name, displayName, defaultValue = Some(0.0), isNullable = true)
      case value: String         => detectAppropriateColumn(name, displayName, value, isNullable = true)
      case _: java.sql.Date      => DateColumn(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: java.sql.Time      => DateTimeColumn(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: java.sql.Timestamp => DateTimeColumn(name, displayName, defaultValue = Some(0L), isNullable = true)
//      case array: Seq[_]         => createArrayColumn(name, displayName, array, isNullable = true)
//      case array: Array[AnyRef]  => createArrayColumn(name, displayName, array, isNullable = true)
//      case map: Map[String, Any]      => createNestedColumn(name, displayName, map, isNullable = true)
      case _: java.math.BigDecimal  => DoubleColumn(name, displayName, defaultValue = Some(0.0), isNullable = true)
      case _: java.math.BigInteger  => Int64Column(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _: scala.math.BigDecimal => DoubleColumn(name, displayName, defaultValue = Some(0.0), isNullable = true)
      case _: scala.math.BigInt     => Int64Column(name, displayName, defaultValue = Some(0L), isNullable = true)
      case _                        => StringColumn(name, displayName, defaultValue = Some(""), isNullable = true)
    }
  }

  def detectAppropriateColumn(name: String, displayName: String, value: String, isNullable: Boolean): Column = {
    val converters = Seq[(String, String, String) => Option[Column]](
      convertAsDateTimeColumn,
      convertAsDateColumn
    )

    converters
      .foldLeft[Option[Column]](None) { (resultColumn, converter) =>
        if (resultColumn.isDefined) resultColumn else converter(name, displayName, value)
      }
      .getOrElse(StringColumn(name, displayName, defaultValue = Some(""), isNullable = isNullable))
  }

  private def findAppropriateDateTimeFormat(value: String, formats: Seq[String]): Option[String] = {
    def isCorrectFormat(dateInStr: String, format: String): Boolean = {
      try {
        val time = TimeUtils.parse(dateInStr, format)
        val convertedDate = TimeUtils.format(time, format)
        println(s"$dateInStr ====== $convertedDate")
        TimeUtils.isEqualDate(dateInStr, convertedDate)
      } catch {
        case _ =>
          false
      }
    }

    formats.foldLeft[Option[String]](None) { (result, format) =>
      result match {
        case Some(fmt)                           => Some(fmt)
        case _ if isCorrectFormat(value, format) => Some(format)
        case _                                   => None
      }
    }
  }

  private def convertAsDateTimeColumn(name: String, displayName: String, value: String): Option[Column] = {
    val formats = Seq(
      "MM/dd/yyyy HH:mm:ss.SSS",
      "MM/dd/yyyy HH:mm:ss",
      "MM/dd/yyyy HH:mm",
      "MM/dd/yyyy HH",
      "MM-dd-yyyy HH:mm:ss.SSS",
      "MM-dd-yyyy HH:mm:ss",
      "MM-dd-yyyy HH:mm",
      "MM-dd-yyyy HH",
      "dd/MM/yyyy HH:mm:ss.SSS",
      "dd/MM/yyyy HH:mm:ss",
      "dd/MM/yyyy HH:mm",
      "dd/MM/yyyy HH",
      "dd-MM-yyyy HH:mm:ss.SSS",
      "dd-MM-yyyy HH:mm:ss",
      "dd-MM-yyyy HH:mm",
      "dd-MM-yyyy HH"
    )

    findAppropriateDateTimeFormat(value, formats).map { format =>
      DateTime64Column(
        name,
        displayName,
        defaultValue = Some(0L),
        inputFormats = Seq(format),
        isNullable = true
      )
    }
  }

  private def convertAsDateColumn(name: String, displayName: String, value: String): Option[Column] = {
    val formats = Seq(
      "MM/dd/yyyy",
      "MM-dd-yyyy",
      "dd/MM/yyyy",
      "dd-MM-yyyy"
    )
    findAppropriateDateTimeFormat(value, formats).map { format =>
      DateColumn(name, displayName, defaultValue = Some(0L), inputFormats = Seq(format), isNullable = true)
    }

  }

  private def createArrayColumn(name: String, displayName: String, data: Seq[Any], isNullable: Boolean): ArrayColumn = {
    data.headOption match {
      case Some(x: Boolean) =>
        ArrayColumn(name, displayName, column = BoolColumn(name, displayName), isNullable = isNullable)
      case Some(x: Int) =>
        ArrayColumn(name, displayName, column = Int32Column(name, displayName), isNullable = isNullable)
      case Some(x: Long) =>
        ArrayColumn(name, displayName, column = Int64Column(name, displayName), isNullable = isNullable)
      case Some(x: Float) =>
        ArrayColumn(name, displayName, column = FloatColumn(name, displayName), isNullable = isNullable)
      case Some(x: Double) =>
        ArrayColumn(name, displayName, column = DoubleColumn(name, displayName), isNullable = isNullable)
      case Some(x: String) =>
        ArrayColumn(name, displayName, column = StringColumn(name, displayName), isNullable = isNullable)
      case Some(x: java.sql.Date) =>
        ArrayColumn(name, displayName, column = DateColumn(name, displayName), isNullable = isNullable)
      case Some(x: java.sql.Timestamp) =>
        ArrayColumn(name, displayName, column = DateTime64Column(name, displayName), isNullable = isNullable)
      case _ => ArrayColumn(name, displayName, column = StringColumn(name, displayName), isNullable = isNullable)
    }
  }

  private def createNestedColumn(
      name: String,
      displayName: String,
      properties: Map[String, Any],
      isNullable: Boolean
  ): NestedColumn = {
    val columns = detectColumns(properties)
    NestedColumn(
      name = name,
      displayName = displayName,
      description = None,
      nestedColumns = columns,
      isNullable = isNullable
    )
  }

  def normalizeProperties(properties: Map[String, Any]): Map[String, Any] = {
    properties
      .filter(_._1 != null)
      .map(e => e._1.toSnakeCase -> e._2)
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
      case Types.TIME_WITH_TIMEZONE =>
        DateTimeColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
      case Types.TIMESTAMP_WITH_TIMEZONE =>
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

      case _ => StringColumn(columnData.name, columnData.displayName, isNullable = columnData.isNullable)
    }
  }

}
