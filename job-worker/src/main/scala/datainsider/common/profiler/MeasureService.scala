package datainsider.common.profiler

import hapax.{TemplateDataDictionary, TemplateDictionary, TemplateResourceLoader}

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.LongAdder
import scala.collection.JavaConverters._
import scala.collection.mutable.ListBuffer

trait MeasureService {

  def startMeasure(funcName: String): Unit

  def stopMeasure(funcName: String, executionTime: Long)

  def reportAsText(): String

  def reportAsHtml(instanceName: String, refreshTimeInSecond: Int): String

  def formatTable(table: Seq[Seq[Any]]): String = {
    if (table.isEmpty) ""
    else {
      // Get column widths based on the maximum cell width in each column (+2 for a one character padding on each side)
      val colWidths: Seq[Int] =
        table.transpose.map(_.map(cell => if (cell == null) 0 else cell.toString.length).max + 2)
      // Format each row
      val rows = table.map(
        _.zip(colWidths)
          .map { case (item, size) => (" %-" + (size - 1) + "s").format(item) }
          .mkString("|", "|", "|")
      )
      // Formatted separator row, used to separate the header and draw table borders
      val separator = colWidths.map("-" * _).mkString("+", "+", "+")
      // Put the table together and return
      (separator +: rows.head +: separator +: rows.tail :+ separator).mkString("\n")
    }
  }

  def getHistory(funcName: String): List[Record]

  def getHistory(): Map[String, List[Record]]

}

case class Record(atTime: Long, executionTime: Long)

class MeasureValue(val funcName: String) {
  val maxHistoryRecord: Int = System.getProperty("ProfilerMaxHistory", "1000").toInt
  val totalTime = new LongAdder()
  val numCurrentPending = new LongAdder()
  val totalHit = new LongAdder()
  val historyRecords = new FixedQueue[Record](maxHistoryRecord)

  def startMeasure(): Unit = {
    numCurrentPending.increment()
    totalHit.increment()
  }

  def stopMeasure(executionTime: Long): Unit = {
    numCurrentPending.decrement()
    totalTime.add(executionTime)
    historyRecords += Record(System.currentTimeMillis(), executionTime)
  }
}

class CumulativeMeasureService extends MeasureService {

  val measureValueMap: ConcurrentHashMap[String, MeasureValue] = new ConcurrentHashMap[String, MeasureValue]()
  protected val loader = TemplateResourceLoader.create("template/")
  protected val tmpl = loader.getTemplate("profiler")

  def getMeasureValue(funcName: String): MeasureValue = {
    if (!measureValueMap.containsKey(funcName))
      measureValueMap.putIfAbsent(funcName, new MeasureValue(funcName))
    measureValueMap.get(funcName)
  }

  override def startMeasure(funcName: String): Unit = {
    getMeasureValue(funcName).startMeasure()
  }

  override def stopMeasure(funcName: String, executionTime: Long): Unit = {
    getMeasureValue(funcName).stopMeasure(executionTime)
  }

  override def reportAsText(): String = {
    val header = Seq("Function", "Total Time (ms)", "Total Hit", "Avg (ms)", "Num Pending")
    val report = ListBuffer[Seq[Any]]()
    report.append(header)

    measureValueList().foreach(v => {
      val avg = if (v.totalHit.longValue() == 0) 0 else v.totalTime.longValue() / v.totalHit.longValue()
      report.append(Seq(v.funcName, v.totalTime, v.totalHit, avg, v.numCurrentPending.longValue()))
    })

    formatTable(report.toList)
  }

  override def reportAsHtml(instanceName: String, refreshTimeInSecond: Int): String = {
    val dict = TemplateDictionary.create()
    dict.setVariable("instanceName", instanceName)
    dict.setVariable("refreshTimeInSec", refreshTimeInSecond.toString)

    var cnt = 0
    measureValueList().foreach(v => {
      val reqRate: Double = v.totalHit.longValue().toDouble / (v.totalTime.longValue().toDouble / 1000 + 0.0001)
      val historyRecords: List[Record] = getHistory(v.funcName)
      val recordsAsStr: String =
        historyRecords.map(r => "[" + r.atTime + ", " + r.executionTime + "]").mkString("[", ", ", "]")
      val highestTimeReq: Long =
        if (historyRecords.nonEmpty) historyRecords.maxBy(_.executionTime).executionTime
        else 0L
      val lastReqExecTime: Long =
        if (historyRecords.nonEmpty) historyRecords.last.executionTime
        else 0L
      val section: TemplateDataDictionary = dict.addSection("MeasureValues")

      section.setVariable("id", cnt.toString)
      section.setVariable("reqName", v.funcName)
      section.setVariable("totalReq", v.totalHit.toString)
      section.setVariable("pendingReq", v.numCurrentPending.toString)
      section.setVariable("lastTmReq", lastReqExecTime.toString)
      section.setVariable("highestTmReq", highestTimeReq.toString)
      section.setVariable("totalTmReq", v.totalTime.toString)
      section.setVariable("reqRate", trunc(reqRate, 2).toString)
      section.setVariable("tmRate", trunc(1000.0 / reqRate, 2).toString)
      section.setVariable("historyRecords", recordsAsStr)

      cnt += 1
    })

    tmpl.renderToString(dict)
  }

  override def getHistory(funcName: String): List[Record] = {
    val value = measureValueMap.get(funcName)
    if (value != null) {
      value.historyRecords.toList
    } else scala.collection.immutable.List()
  }

  override def getHistory(): Map[String, List[Record]] = {
    measureValueMap.asScala.toMap.map(f => (f._1, getHistory(f._1)))
  }

  private def measureValueList(): List[MeasureValue] = {
    measureValueMap.asScala.toList
      .sortBy(f => f._1)
      .map(_._2)
  }

  private def trunc(x: Double, n: Int) = {
    def p10(n: Int, pow: Long = 10): Long = if (n == 0) pow else p10(n - 1, pow * 10)
    if (n < 0) {
      val m = p10(-n).toDouble
      math.round(x / m) * m
    } else {
      val m = p10(n).toDouble
      math.round(x * m) / m
    }
  }
}
