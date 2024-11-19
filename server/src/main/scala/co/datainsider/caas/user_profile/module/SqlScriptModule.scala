package co.datainsider.caas.user_profile.module

import co.datainsider.bi.client.JdbcClient
import com.google.inject.name.Names
import com.twitter.inject.TwitterModule
import co.datainsider.common.client.exception.DbExecuteError

import scala.io.Source

/**
  * Ensure & Init database and tables
  * @author andy
  */
object SqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client = injector.instance[JdbcClient](Names.named("mysql"))

    val schemaOk: Boolean = Seq(
      readSqlScript("sql/caas.sql")(client.executeUpdate(_) >= 0),
      readSqlScript("sql/ingestion.sql")(client.executeUpdate(_) >= 0),
      readSqlScript("sql/etl.sql")(client.executeUpdate(_) >= 0)
    ).reduceLeft(_ && _)
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
