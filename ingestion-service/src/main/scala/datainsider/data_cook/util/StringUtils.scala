package datainsider.data_cook.util

/**
  * @author tvc12 - Thien Vi
  * @created 10/27/2021 - 3:21 PM
  */
object StringUtils {
  lazy val EMAIL_PATTERN = "^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$"

  /**
   * find group matched with regex pattern
   */
  def findAll(text: String, pattern: String, groupIndex: Int): Seq[String] = {
    pattern.r.findAllIn(text).matchData.map(matched => matched.group(groupIndex)).toSeq
  }

  def test(text: String, pattern: String): Boolean ={
    pattern.r.findFirstMatchIn(text).isDefined
  }

  def normalizeName(text: String): String = {
    val columnName = if (text == null || text.isEmpty) {
      "null"
    } else {
      text.replaceAll("[`]+", "_")
    }
    columnName
  }

  def isEmailFormat(email: String): Boolean = {
    val rex = EMAIL_PATTERN.r
    rex.findFirstMatchIn(email) match {
      case Some(_) => true
      case None    => false
    }
  }
}
