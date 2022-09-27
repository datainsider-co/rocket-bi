package datainsider.schema.domain.column

@SerialVersionUID(20200715L)
case class UInt8Column(
    name: String,
    displayName: String,
    description: Option[String] = None,
    defaultValue: Option[Short] = None,
    isNullable: Boolean = false,
    isEncrypted: Boolean = false,
    defaultExpr: Option[String] = None,
    defaultExpression: Option[DefaultExpression] = None
) extends Column {
  override def copyTo(name: String, newName: String): Column = this.copy(name = name, displayName = newName)

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

@SerialVersionUID(20200715L)
case class UInt16Column(
    name: String,
    displayName: String,
    description: Option[String] = None,
    defaultValue: Option[Short] = None,
    isNullable: Boolean = false,
    isEncrypted: Boolean = false,
    defaultExpr: Option[String] = None,
    defaultExpression: Option[DefaultExpression] = None
) extends Column {
  override def copyTo(name: String, newName: String): Column = this.copy(name = name, displayName = newName)

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

@SerialVersionUID(20200715L)
case class UInt32Column(
    name: String,
    displayName: String,
    description: Option[String] = None,
    defaultValue: Option[Int] = None,
    isNullable: Boolean = false,
    isEncrypted: Boolean = false,
    defaultExpr: Option[String] = None,
    defaultExpression: Option[DefaultExpression] = None
) extends Column {
  override def copyTo(name: String, newName: String): Column = this.copy(name = name, displayName = newName)

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

@SerialVersionUID(20200715L)
case class UInt64Column(
    name: String,
    displayName: String,
    description: Option[String] = None,
    defaultValue: Option[Long] = None,
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
