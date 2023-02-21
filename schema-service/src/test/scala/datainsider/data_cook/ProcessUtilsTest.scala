package datainsider.data_cook

import datainsider.data_cook.util.ProcessUtils
import org.scalatest.FunSuite

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.TimeoutException

/**
 * created 2023-01-08 4:34 PM
 *
 * @author tvc12 - Thien Vi
 */
 class ProcessUtilsTest extends FunSuite {
  test("test execute command success") {
    val logBuffer = new StringBuffer()
    val exitCode = ProcessUtils.execute("ls -l", 10000, logBuffer)
    assert(exitCode == 0)
    println(s"exitCode: ${exitCode}")
    println(s"logBuffer: ${logBuffer.toString}")
  }

  test("test execute failure") {
    val logBuffer = new StringBuffer()
    val exitCode = ProcessUtils.execute("ls -l /tmp/abc", 10000, logBuffer)
    assert(exitCode != 0)
    println(s"exitCode: ${exitCode}")
    println(s"logBuffer: ${logBuffer.toString}")
  }

  test("test execute timeout failure") {
    val logBuffer = new StringBuffer()
    assertThrows[TimeoutException](ProcessUtils.execute("sleep 2", 1000, logBuffer))
    println(s"logBuffer: ${logBuffer.toString}")
  }

  test("test execute timeout success") {
    val logBuffer = new StringBuffer()
    val exitCode = ProcessUtils.execute("sleep 2", 3000, logBuffer)
    assert(exitCode == 0)
    println(s"logBuffer: ${logBuffer.toString}")
  }
}
