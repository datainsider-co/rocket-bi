package co.datainsider.bi.util

import com.twitter.util.logging.Logging

/***
  * Using(getConnection(...)){
  *   conn => {
  *   }
  * }
  */
object Using extends Logging {
  def apply[C <: AutoCloseable, R](resource: C)(function: C => R): R =
    try {
      function(resource)
    } finally {
      try {
        resource.close()
      } catch {
        case ex: Throwable => {
          logger.error(s"Using::close::error: ${ex.getMessage}", ex)
        }
      }
    }
}
