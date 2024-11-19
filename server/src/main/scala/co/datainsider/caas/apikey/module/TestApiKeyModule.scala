package co.datainsider.caas.apikey.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig
import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import co.datainsider.caas.apikey.repository.{ApiKeyRepository, MysqlApikeyRepository}
import co.datainsider.caas.apikey.service.{ApiKeyService, ApikeyServiceImpl}

import javax.inject.{Named, Singleton}

object TestApiKeyModule extends TwitterModule {
  protected override def configure(): Unit = {
    super.configure()
    bind[ApiKeyService].to[ApikeyServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def providesApiKeyRepository(@Named("mysql") client: JdbcClient): ApiKeyRepository = {
    val dbName: String = ZConfig.getString("test_db.mysql.caas_dbname", "caas")
    val tblName: String = ZConfig.getString("api_key.mysql.tbl_name", "api_key")
    new MysqlApikeyRepository(client = client, dbName = dbName, tblName = tblName)
  }
}
