package datainsider.data_cook.module

import com.google.inject.name.Names
import com.twitter.inject.TwitterModule
import datainsider.analytics.module.SqlScriptModule.readSqlScript
import datainsider.client.util.JdbcClient

/**
  * @author tvc12 - Thien Vi
  * @created 10/13/2021 - 5:35 PM
  */

/**
 * Module for execute mock script
 */
object MockDataCookSqlScriptModule extends TwitterModule {
  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client = injector.instance[JdbcClient](Names.named("data_cook_mysql"))

    readSqlScript("sql/test/etl.sql")(client.execute(_))
  }
}
