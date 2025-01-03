package co.datainsider.schema.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.Using
import com.google.inject.name.Names
import com.twitter.inject.TwitterModule

import java.io.InputStream
import scala.io.Source

/**
  *  Ensure & Init database and tables
  *
  * @author andy
  */
object SqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client = injector.instance[JdbcClient](Names.named("mysql"))

    readSqlScript("sql/analytics.sql")(client.executeUpdate(_) > 0)
    readSqlScript("sql/ingestion.sql")(client.executeUpdate(_) > 0)
  }

  def readSqlScript(fileName: String)(fn: String => Boolean): Boolean = {
    val sqlScript = Using(Source.fromFile(fileName, "UTF-8"))(source => source.getLines().mkString("\n"))
    execute(sqlScript)(fn)
  }

  def readSqlScript(inputStream: InputStream)(fn: String => Boolean): Boolean = {
    val sqlScript = Using(Source.fromInputStream(inputStream, "UTF-8"))(source => source.getLines().mkString("\n"))
    execute(sqlScript)(fn)
  }

  private def execute(sqlScript: String)(fn: String => Boolean): Boolean = {
    sqlScript
      .split(";")
      .map(script => fn(script))
      .exists(x => x)
  }
}
