# ETL Operator

```scala
/**
  * Biểu thị cho các phép transform như Join, Manage Fields, ...
  *
  *  Kết quả khi chạy EtlOperator sẽ cho ra 1 table
  *
  *  Các EtlOperator có thể dùng EtlOperator kết hợp với nhau để tạo ra table
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[GetDataOperator], name = "get_data_operator"),
    new Type(value = classOf[JoinOperator], name = "join_operator"),
    new Type(value = classOf[TransformOperator], name = "transform_operator"),
    new Type(value = classOf[ManageFieldOperator], name = "manage_field_operator"),
    new Type(value = classOf[PivotTableOperator], name = "pivot_table_operator"),
    new Type(value = classOf[SQLQueryOperator], name = "sql_query_operator")
  )
)
trait EtlOperator {

  /**
    * Config destination table after process completed
    */
  def destTableConfiguration(): TableConfiguration

  /**
    * Persist table to disk if isPersistent and persistConfiguration is defined
    */
  def isPersistent: Boolean

  /**
    * Persist information, if persistConfiguration is None, nothing happened
    */
  def persistConfiguration(): Option[PersistConfiguration]
}
```

## Table Configuration & Persist Configuration

```scala
/**
  * Config information of output operator
  * @param tblName table name
  * @param dbDisplayName database display name
  * @param tblDisplayName table display name
  */
case class TableConfiguration(
    tblName: String,
    dbDisplayName: String,
    tblDisplayName: String
)

/**
  * Thông tin để persist một view xuống thành 1 table
  * @param dbName target database name
  * @param tblName target table name
  * @param `type` type persist
  */
case class PersistConfiguration(
    dbName: String,
    tblName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef]) `type`: PersistentType,
    displayName: Option[String] = None
)

object PersistentType extends Enumeration {
  type PersistentType = Value
  val Update: PersistentType = Value("Update")
  val Append: PersistentType = Value("Append")
}
class PersistentTypeRef extends TypeReference[PersistentType.type]
```

## Sub class of ETL Operator

### Get Data Operator

```scala
/**
  * Get data từ một table
  * @param tableSchema chứa thông tin đầy đủ để có thể query data
  * @param destTableConfig chứa thông tin khi đích khi chạy operator này
  *                    Nếu không có thì dest table có tên lấy từ table schema
  */
case class GetDataOperator(
    tableSchema: TableSchema,
    destTableConfig: Option[TableConfiguration] = None,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator
```

### Join Operator

```scala
/**
  * @param leftOperator operator bên phải
  * @param rightOperator operator bên trái
  * @param conditions danh sách condtions dùng cho lệnh join.
  * @param joinType   loại join
  */
case class JoinConfig(
    leftOperator: EtlOperator,
    rightOperator: EtlOperator,
    conditions: Array[EqualField],
    @JsonScalaEnumeration(classOf[JoinTypeRef]) joinType: JoinType
)

/**
  * Cho phép join 2 hay nhiều bảng lại với nhau bằng các phép condition
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 2:22 PM
  */
case class JoinOperator(
    joinConfigs: Array[JoinConfig],
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator

class JoinTypeRef extends TypeReference[JoinType.type]

object JoinType extends Enumeration {
  type JoinType = Value
  val Left: JoinType = Value("left")
  val Right: JoinType = Value("right")
  val Inner: JoinType = Value("inner")
  val FullOuter: JoinType = Value("full_outer")
}
```

### Manage Fields Operator

```scala
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
    asType: Option[String] = None,
    scalarFunction: Option[ScalarFunction] = None
)

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
    asType: Option[String] = None,
    isHidden: Boolean = false
)

/**
  * Operator chỉnh sửa field trên kết quả của operator trước đó. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator dùng để lấy thông tin của bảng trước đó
  * @param fields danh sách field có sẵn từ table
  * @param extraFields danh sách field được thêm vào
  */
case class ManageFieldOperator(
    operator: EtlOperator,
    fields: Array[NormalFieldConfiguration],
    destTableConfiguration: TableConfiguration,
    extraFields: Array[ExpressionFieldConfiguration] = Array.empty,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator
```

### Pivot Operator

```scala
/**
  * operator query data as pivot table basic on previous operator and pivot query
  *
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 11:07 AM
  * @param operator previous operator
  * @param query pivot query setting for query data
  */
case class PivotTableOperator(
    operator: EtlOperator,
    query: PivotTableSetting,
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator
```

### SQL Query Operator

```scala
/**
  * Cho phép query 1 table trên operator cho trước. Kết quả là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 10:39 AM
  * @param operator Operator trước đó
  */
case class SQLQueryOperator(
    operator: EtlOperator,
    query: String,
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator
```

### Transform Operator

```scala
/**
  * Operator tạo ra 1 table từ câu query trên kết quả của operator trước đó.. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator là operator dùng để tạo ra table
  * @param query get data từ operator
  */
case class TransformOperator(
    operator: EtlOperator,
    query: GroupTableChartSetting,
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[PersistConfiguration] = None
) extends EtlOperator
```

### Condition

```scala
case class EqualField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

// condition to control behaviour of query
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[And], name = "and"),
    new Type(value = classOf[Or], name = "or"),
    new Type(value = classOf[EqualField], name = "equal_field"),
    new Type(value = classOf[NotEqualField], name = "not_equal_field"),
    new Type(value = classOf[LessThanField], name = "less_than_field"),
    new Type(value = classOf[GreaterThanField], name = "greater_than_field"),
    new Type(value = classOf[LessOrEqualField], name = "less_or_equal_field"),
    new Type(value = classOf[GreaterOrEqualField], name = "greater_or_equal_field")
  )
)
abstract class ControlCondition extends Condition
```