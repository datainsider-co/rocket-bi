package co.datainsider.datacook.domain.operator

import co.datainsider.bi.domain.query._
import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.InvalidOperatorError
import co.datainsider.datacook.domain.operator.FieldType.{FieldType, applyCastScalarFunction}
import co.datainsider.datacook.domain.operator.OldOperator.validateDatabaseName
import co.datainsider.datacook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}
import co.datainsider.datacook.pipeline.operator.Operator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.JsonParser

/**
  * Config field
  */
trait FieldConfiguration {

  /**
    * Get display name of field
    */
  def displayName: String

  /**
    * Function select field
    */
  def toSelectFunction: Function

  /**
    * Field show or hidden
    */
  def isHidden: Boolean
}

class FieldTypeRef extends TypeReference[FieldType.type]
object FieldType extends Enumeration {
  type FieldType = Value
  val Int8: FieldType = Value("int8")
  val Int16: FieldType = Value("int16")
  val Int32: FieldType = Value("int32")
  val Int64: FieldType = Value("int64")
  val UInt8: FieldType = Value("uint8")
  val UInt16: FieldType = Value("uint16")
  val UInt32: FieldType = Value("uint32")
  val UInt64: FieldType = Value("uint64")
  val Float: FieldType = Value("float")
  val Double: FieldType = Value("double")
  val Date: FieldType = Value("date")
  val DateTime: FieldType = Value("datetime")
  val DateTime64: FieldType = Value("datetime64")
  val String: FieldType = Value("string")
  val Timestamp: FieldType = Value("timestamp")

  /**
    * Case a field to correct field type
    */
  def applyCastScalarFunction(
      columnType: FieldType,
      innerScalarFn: Option[ScalarFunction] = None
  ): Option[ScalarFunction] =
    Option {
      columnType match {
        case Int8       => ToInt8OrNull(innerScalarFn)
        case Int16      => ToInt16OrNull(innerScalarFn)
        case Int32      => ToInt32OrNull(innerScalarFn)
        case Int64      => ToInt64OrNull(innerScalarFn)
        case UInt8      => ToUInt8OrNull(innerScalarFn)
        case UInt16     => ToUInt16OrNull(innerScalarFn)
        case UInt32     => ToUInt32OrNull(innerScalarFn)
        case UInt64     => ToUInt64OrNull(innerScalarFn)
        case Float      => ToFloatOrNull(innerScalarFn)
        case Double     => ToDoubleOrNull(innerScalarFn)
        case Date       => ToDateOrNull(innerScalarFn)
        case DateTime   => ToDateTimeOrNull(innerScalarFn)
        case DateTime64 => ToDateTime64OrNull(innerScalarFn)
        case Timestamp  => ToDateTime64OrNull(innerScalarFn)
        case String     => ToStringOrNull(innerScalarFn)
        case _          => innerScalarFn.orNull
      }
    }
}

/**
  * field from table
  * @param displayName display name of field
  * @param field from table
  * @param isHidden remove column if true, use for hidden column in destination table
  * @param scalarFunction scalar function of field
  */
case class NormalFieldConfiguration(
    displayName: String,
    field: TableField,
    isHidden: Boolean = false,
    @JsonScalaEnumeration(classOf[FieldTypeRef]) asType: Option[FieldType] = None,
    scalarFunction: Option[ScalarFunction] = None
) extends FieldConfiguration {
  override def toSelectFunction: Function = {
    val scalarFn = asType match {
      case Some(fieldType) => applyCastScalarFunction(fieldType)
      case _               => None
    }
    Select(field, scalarFn, Some(displayName))
  }
}

/**
  * Field config by expression sql
  * @param fieldName name of column
  * @param displayName display name
  * @param expression sql syntax
  * @param asType cast column type, if none use default type of query
  * @param isHidden remove column if true
  */
case class ExpressionFieldConfiguration(
    fieldName: String,
    displayName: String,
    expression: String,
    @JsonScalaEnumeration(classOf[FieldTypeRef]) asType: Option[FieldType] = None,
    isHidden: Boolean = false
) extends FieldConfiguration {
  override def toSelectFunction: Function = {
    val scalarFn = asType match {
      case Some(fieldType) => applyCastScalarFunction(fieldType)
      case _               => None
    }
    SelectExpr(expression, Some(displayName), scalarFn)
  }
}

/**
  * Operator chỉnh sửa field trên kết quả của operator trước đó. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator dùng để lấy thông tin của bảng trước đó
  * @param fields danh sách field có sẵn từ table
  * @param extraFields danh sách field được thêm vào
  */
@deprecated("Use ManageFieldOperator instead", "1.0")
case class OldManageFieldOperator(
    operator: OldOperator,
    fields: Array[NormalFieldConfiguration],
    destTableConfiguration: DestTableConfig,
    extraFields: Array[ExpressionFieldConfiguration] = Array.empty,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends OldOperator {
  def getActiveFieldConfigs(): Array[FieldConfiguration] = {
    (fields ++: extraFields).filterNot(field => field.isHidden).toArray[FieldConfiguration]
  }

  def toQuery: Query = {
    ObjectQuery(
      functions = getActiveFieldConfigs().map(_.toSelectFunction)
    )
  }

  @JsonIgnore
  override def id: OperatorId = {
    val keys: Array[String] = Array(operator.id, destTableConfiguration.tblName)
    makeId(keys: _*)
  }

  /**
    * Valid a operator correct
    */
  override def validate(): Unit = {
    operator.validate()
    validate(getActiveFieldConfigs())
    getActionConfigurations().foreach(_.validate())
  }

  private def validate(configurations: Array[FieldConfiguration]): Unit = {
    val json = JsonParser.toJson(configurations)
    val result = validateDatabaseName(json)
    if (result.isInvalid()) {
      throw InvalidOperatorError(
        s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}",
        this
      )
    }
  }

  /**
    * get all action of operator
    */
  override def getActionConfigurations(): Array[ActionConfiguration] = {
    val actions = persistConfiguration ++ thirdPartyPersistConfigurations ++ emailConfiguration
    actions.toArray
  }

  override def getDestTableNames(): Set[OperatorId] = {
    operator.getDestTableNames() ++ Set(destTableConfiguration.tblName)
  }

  override def getNestedOperators(): Array[OldOperator] = {
    operator.getNestedOperators() ++ Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    import co.datainsider.datacook.pipeline.{operator => pipeline}
    val operatorId: Operator.OperatorId = getOperatorId(id)
    pipeline.ManageFieldOperator(operatorId, fields, destTableConfiguration, extraFields)
  }

  override def getParentOperators(): Array[OldOperator] = Array(operator)
}
