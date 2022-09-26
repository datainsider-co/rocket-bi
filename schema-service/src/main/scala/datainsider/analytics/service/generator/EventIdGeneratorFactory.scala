package datainsider.analytics.service.generator

import datainsider.ingestion.util.TimeUtils
import education.x.commons.{I32IdGenerator, IDGenerator}
import org.nutz.ssdb4j.spi.SSDB

@deprecated("no longer use")
trait EventIdGeneratorFactory {
  def eventIdGenerator(): IDGenerator[Int]

  def eventIdGenerator(beginOfDayInMillis: Long): IDGenerator[Int]
}

case class SSDBEventIdGeneratorFactory(client: SSDB) extends EventIdGeneratorFactory {
  def eventIdGenerator(): IDGenerator[Int] = {
    val (beginOfDayInMillis, _) = TimeUtils.calcBeginOfDayInMills()
    eventIdGenerator(beginOfDayInMillis)
  }

  def eventIdGenerator(beginOfDayInMillis: Long): IDGenerator[Int] = {
    I32IdGenerator("datainsider/analytics", s"EventIdGenerator_$beginOfDayInMillis", client)
  }
}
