package co.datainsider.bi.util

import scala.io.Source

object FileUtils {
  def readResourceAsString(path: String): String = {
    Using(Source.fromInputStream(getClass.getClassLoader.getResourceAsStream(path)))(
      _.getLines().mkString("\n")
    )
  }
}
