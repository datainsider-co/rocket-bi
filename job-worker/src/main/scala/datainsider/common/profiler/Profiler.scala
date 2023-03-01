package datainsider.common.profiler

import datainsider.jobworker.util.ZConfig

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.{ExecutionContext, Future}

trait Profiler {

  def apply[T](f: => T)(implicit ec: ExecutionContext): T

  def apply[T](f: => Future[T])(implicit ec: ExecutionContext): Future[T]
}

object Profiler {

  val measureService: MeasureService = new CumulativeMeasureService

  val isEnable: AtomicBoolean = new AtomicBoolean(true)

  val instanceName: String = ZConfig.getString("profiler.instance_name", "job-worker")

  def apply(funcName: String): Profiler = {

    new Profiler() {

      override def apply[T](f: => T)(implicit ec: ExecutionContext): T = {
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

      override def apply[T](f: => Future[T])(implicit ec: ExecutionContext): Future[T] = {
        if (isEnable.get()) {
          measureService.startMeasure(funcName)
          val t1 = System.currentTimeMillis()
          f.onComplete(_ => {
            measureService.stopMeasure(funcName, System.currentTimeMillis() - t1)
          })
          f
        } else f
      }
    }
  }

  def report(): String = measureService.reportAsText()

  def reportAsHtml(refreshTimeInSec: Int = 0): String = {
    measureService.reportAsHtml(instanceName, refreshTimeInSec)
  }

  def enable(): Unit = isEnable.set(true)

  def disable(): Unit = isEnable.set(false)

  def getHistory(funcName: String): List[Record] = measureService.getHistory(funcName)

  def getHistory(): Map[String, List[Record]] = measureService.getHistory()

}
