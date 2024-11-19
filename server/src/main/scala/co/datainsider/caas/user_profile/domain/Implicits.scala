package co.datainsider.caas.user_profile.domain

/**
  * @author anhlt
  */
object Implicits {
  implicit class OptionString(val s: Option[String]) extends AnyVal {
    def notEmptyOrNull: Option[String] = s.flatMap(x => if (x != null && x.trim.nonEmpty) Some(x.trim) else None)
  }

}
