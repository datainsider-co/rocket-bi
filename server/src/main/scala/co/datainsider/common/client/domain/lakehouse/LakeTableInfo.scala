package co.datainsider.common.client.domain.lakehouse

case class LakeTableInfo(
    id: String,
    tableName: String,
    accessType: Int,
    ownerId: String,
    dataSource: Seq[String],
    schema: Seq[LakeColumn],
    delimiter: String,
    parseFailMode: Int,
    description: String
)

case class LakeColumn(
    position: Int,
    name: String,
    `type`: String,
    desc: String,
    defaultValue: String
)

object LakeColumnType {
  val SHORT = "short"
  val INTEGER = "integer"
  val LONG = "long"
  val FLOAT = "float"
  val DOUBLE = "double"
  val BOOLEAN = "boolean"
  val STRING = "string"
  val DATE = "date"
  val TIMESTAMP = "timestamp"
}
