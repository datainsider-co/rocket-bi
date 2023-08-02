package co.datainsider.schema.domain.column

@SerialVersionUID(20200715L)
case class StringColumn(
    name: String,
    displayName: String,
    description: Option[String] = None,
    defaultValue: Option[String] = None,
    isNullable: Boolean = false,
    isEncrypted: Boolean = false,
    defaultExpr: Option[String] = None,
    defaultExpression: Option[DefaultExpression] = None
) extends Column {
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
      defaultExpression = defaultExpression,
      isEncrypted = isEncrypted
    )
  }
}
