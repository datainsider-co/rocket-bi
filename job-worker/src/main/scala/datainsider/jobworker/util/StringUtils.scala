package datainsider.jobworker.util

object StringUtils {
  def getOriginTblName(destTblName: String): String = {
    val tmpTableRegex = """^__di_tmp_([\w]+)_(\d{13})$""".r
    destTblName match {
      case tmpTableRegex(name, _) => name
      case _                      => destTblName
    }
  }

  implicit class RichOptionConvert(val text: String) extends AnyVal {
    def toLongOption(): Option[Long] =
      try {
        Some(text.toLong)
      } catch {
        case e: NumberFormatException => None
      }
  }
}
