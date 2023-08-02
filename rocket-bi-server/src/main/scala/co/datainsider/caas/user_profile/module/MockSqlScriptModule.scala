package co.datainsider.caas.user_profile.module

import co.datainsider.bi.client.JdbcClient
import com.google.inject.name.Names
import com.twitter.inject.TwitterModule

/**
  * Ensure & Init database and tables
  *
  * @author andy
  */
object MockSqlScriptModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    val client = injector.instance[JdbcClient](Names.named("mysql"))
    SqlScriptModule.readSqlScript("sql/caas.sql")(client.executeUpdate(_) >= 0)
  }
}
