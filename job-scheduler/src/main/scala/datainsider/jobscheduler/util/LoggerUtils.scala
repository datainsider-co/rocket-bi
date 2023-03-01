package datainsider.jobscheduler.util

import java.util.concurrent.ConcurrentHashMap

import org.slf4j.LoggerFactory
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
