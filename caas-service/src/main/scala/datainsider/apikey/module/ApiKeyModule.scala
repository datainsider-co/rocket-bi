package datainsider.apikey.module

import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import datainsider.apikey.repository.{ApiKeyRepository, MysqlApikeyRepository}
import datainsider.apikey.service.{ApiKeyService, ApikeyServiceImpl}
import datainsider.client.util.{JdbcClient, ZConfig}

import javax.inject.{Named, Singleton}

object ApiKeyModule extends TwitterModule {
  protected override def configure(): Unit = {
    super.configure()
    bind[ApiKeyService].to[ApikeyServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def providesApiKeyRepository(@Named("caas_jdbc_client") client: JdbcClient): ApiKeyRepository = {
    val dbName: String = ZConfig.getString("db.mysql.dbname")
    val tblName: String = ZConfig.getString("api_key.mysql.tbl_name")
    new MysqlApikeyRepository(client = client, dbName = dbName, tblName = tblName)
  }
}
