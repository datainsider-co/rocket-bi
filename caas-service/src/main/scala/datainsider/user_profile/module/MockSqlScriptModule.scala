package datainsider.user_profile.module

import com.google.inject.name.Names
import com.twitter.inject.TwitterModule
import datainsider.client.util.{JdbcClient, ZConfig}

import scala.io.Source

/**
  * Ensure & Init database and tables
  *
  * @author andy
  */
object MockSqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    val client = injector.instance[JdbcClient](Names.named("global_jdbc_client"))
    SqlScriptModule.readSqlScript("sql/caas_test.sql")(client.executeUpdate(_) >= 0)
  }
}
