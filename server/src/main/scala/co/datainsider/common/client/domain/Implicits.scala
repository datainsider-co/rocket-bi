package co.datainsider.common.client.domain

/**
  * @author anhlt
  */
object Implicits {
  val VALUE_NULL = "<null>"

  implicit class RichString(val value: String) extends AnyVal {

    def asEventName = {
      value.trim.replaceAll("\\s+", "_").toLowerCase()
    }

    def asColumnName: String = {
      value
        .trim()
        .toLowerCase()
        .replaceAll("\\n", "_")
        .replaceAll("\\r", "_")
        .replaceAll("\\s+", "_")
        .replaceAll("_+", "_")
    }
  }

  implicit class RichOptionString(val s: Option[String]) extends AnyVal {

    def notNull: Option[String] = s.filterNot(_ == null)

    def notNullOrEmpty: Option[String] = {
      s.filterNot(_ == null)
        .filterNot(_.isEmpty)
    }
  }

  implicit class ImplicitObject(val value: Object) extends AnyVal {
    def asString: String = {
      if (value == null) VALUE_NULL
      else value.toString
    }
  }
}
