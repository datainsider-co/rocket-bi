package datainsider.user_profile.module

import com.google.inject.name.Names
import com.twitter.inject.TwitterModule
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.{JdbcClient, ZConfig}

import scala.io.Source

/**
  * Ensure & Init database and tables
  * @author andy
  */
object SqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client = injector.instance[JdbcClient](Names.named("global_jdbc_client"))

    val schemaOk: Boolean = readSqlScript("sql/caas.sql")(client.executeUpdate(_) >= 0)
    if (!schemaOk) throw DbExecuteError("Error occurred when init caas schema!")
  }

  def readSqlScript(fileName: String)(execute: String => Boolean): Boolean = {
    val fileSource = Source.fromFile(fileName, "UTF-8")
    val sqlFileStr: String = fileSource.getLines().mkString("\n")
    fileSource.close()

    sqlFileStr
      .split(";")
      .map { script =>
        val sql = script.trim
        info(sql)

        if (sql.isEmpty || sql.substring(0, 3) == "---") { // sql comment
          true
        } else {
          try {
            execute(sql)
          } catch {
            case e: Throwable =>
              error(s"error to execute init caas database script: $sql - Reason: $e")
              false
          }
        }
      }
      .forall(_ == true)
  }
}
