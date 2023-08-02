package co.datainsider.bi.util

import org.slf4j.LoggerFactory

import java.util.concurrent.ConcurrentHashMap

/**
  * @author anhlt
  */
object LoggerUtils {
  val logMap = new ConcurrentHashMap[String, org.slf4j.Logger]()

  def getLogger(name: String): org.slf4j.Logger = {
    if (!logMap.contains(name)) {
      logMap.synchronized({
        if (!logMap.contains(name)) {
          logMap.put(name, LoggerFactory.getLogger(name))
        }
      })
    }
    logMap.get(name)

  }
}
