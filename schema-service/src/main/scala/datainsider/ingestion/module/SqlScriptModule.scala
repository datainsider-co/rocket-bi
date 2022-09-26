package datainsider.ingestion.module

import com.google.inject.name.Names
import com.twitter.inject.TwitterModule
import datainsider.client.util.JdbcClient
import datainsider.ingestion.util.Using

import scala.io.Source

/**
  *  Ensure & Init database and tables
  *
  * @author andy
  */
object SqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client = injector.instance[JdbcClient](Names.named("mysql-ingestion"))

    readSqlScript(getClass.getClassLoader.getResource("sql/analytics.sql").getPath)(client.execute(_))
  }

  def readSqlScript(fileName: String)(fn: String => Boolean): Boolean = {
    val sqlScript = Using(Source.fromFile(fileName, "UTF-8"))(source => source.getLines().mkString("\n"))

    sqlScript
      .split(";")
      .map(script => {
        info(script)
        fn(script)
      })
      .exists(x => x)
  }
}
