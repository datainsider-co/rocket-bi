package datainsider.ingestion.domain

import datainsider.ingestion.domain.column.DefaultExpression

@SerialVersionUID(20200715L)
case class NestedColumn(
    name: String,
    displayName: String,
    description: Option[String] = None,
    nestedColumns: Seq[Column],
    isEncrypted: Boolean = false,
    isNullable: Boolean = false
) extends Column {
  override val defaultExpr: Option[String] = None
  override val defaultExpression: Option[DefaultExpression] = None
  override def copyTo(name: String, displayName: String): Column = this.copy(name = name, displayName = displayName)

  override def copyTo(
      name: String,
      displayName: String,
      description: Option[String],
      isNullable: Boolean,
      defaultExpression: Option[DefaultExpression],
      isEncrypted: Boolean
  ): Column = {
    this.copy(
      name = name,
      displayName = displayName,
      description = description,
      isNullable = isNullable,
      isEncrypted = isEncrypted
    )
  }
}
