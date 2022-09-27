package datainsider.schema.domain.column

object DefaultTypes {
  val DEFAULT = "DEFAULT"
  val MATERIALIZED = "MATERIALIZED"
  val CALCULATED = "CALCULATED"
  val MEASURED = "MEASURED"
}

/**
  *
  * @param defaultType <code>DefaultTypes</code>
  * @param expr `String`
  */
case class DefaultExpression(defaultType: String, expr: String) {
  def buildExpression(): String = {
    s"$defaultType $expr"
  }
}
