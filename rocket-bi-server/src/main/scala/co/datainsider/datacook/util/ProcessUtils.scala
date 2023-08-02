package co.datainsider.datacook.util

import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

import java.util.concurrent.TimeUnit
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future, TimeoutException, blocking}
import scala.sys.process.{Process, ProcessLogger}

/**
  * created 2023-01-08 3:55 PM
  *
  * @author tvc12 - Thien Vi
  */
object ProcessUtils extends Logging {

  /**
    * method will execute command by scala process and return exit code value.
    * process throw timeout exception if process run longer than timeout
    */
  @throws[TimeoutException]("if process run longer than timeout")
  @throws[InternalError]("if process run error")
  def execute(cmd: String, timeoutMs: Long, logBuffer: StringBuffer)(implicit executor: ExecutionContext): Int = {
    try {
      val processLogger = ProcessLogger(line => logBuffer.append(line).append("\n"))
      val process: Process = Process(cmd).run(processLogger)
      try {
        val exitValue: Future[Int] = Future(process.exitValue())
        val exitCode: Int = Await.result(exitValue, Duration(timeoutMs, TimeUnit.MILLISECONDS))
        exitCode
      } catch {
        case ex: Throwable => {
          process.destroy()
          throw ex
        }
      }
    } catch {
      case ex: TimeoutException =>
        logger.error(s"Process timeout: $cmd")
        throw ex
      case ex: Throwable => {
        val errorMsg: String = s"Command execution failed, cause ${ex.getMessage}"
        logger.error(errorMsg)
        throw InternalError(errorMsg)
      }
    }
  }
}
