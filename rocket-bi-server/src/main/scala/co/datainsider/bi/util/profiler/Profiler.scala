package co.datainsider.bi.util.profiler

import java.util.concurrent.atomic.AtomicBoolean
import com.twitter.util.Future

trait Profiler {

  def apply[T](f: => T): T

  def apply[T](f: => Future[T]): Future[T]
}

object Profiler {

  val measureService: MeasureService = new CumulativeMeasureService

  val isEnable: AtomicBoolean = new AtomicBoolean(true)

  def apply(funcName: String): Profiler = {

    new Profiler() {

      override def apply[T](f: => T): T = {
        if (isEnable.get()) {
          val t1 = System.currentTimeMillis()
          try {
            measureService.startMeasure(funcName)
            f
          } finally {
            measureService.stopMeasure(funcName, System.currentTimeMillis() - t1)
          }
        } else f

      }

      override def apply[T](f: => Future[T]): Future[T] = {
        if (isEnable.get()) {
          measureService.startMeasure(funcName)
          val t1 = System.currentTimeMillis()
          f.ensure {
            measureService.stopMeasure(funcName, System.currentTimeMillis() - t1)
          }
        } else f
      }
    }
  }

  def report(): String = measureService.reportAsText()

  def reportAsHtml(): String = measureService.reportAsHtml()

  def enable(): Unit = isEnable.set(true)

  def disable(): Unit = isEnable.set(false)

  def getHistory(funcName: String): List[Record] = measureService.getHistory(funcName)

  def getHistory(): Map[String, List[Record]] = measureService.getHistory()

}
