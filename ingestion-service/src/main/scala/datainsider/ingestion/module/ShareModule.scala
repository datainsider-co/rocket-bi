package datainsider.ingestion.module

import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.util.{NativeJdbcClient, ZConfig}
import datainsider.ingestion.repository.{MySqlShareRepository, ShareRepository}
import datainsider.ingestion.service.{ShareService, ShareServiceImpl}
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB

object ShareModule extends TwitterModule {

  override def configure(): Unit = {
    bindSingleton[ShareService].to[ShareServiceImpl]
  }

  @Singleton
  @Provides
  def provideShareRepository(ssdb: SSDB): ShareRepository = {
    val dbName: String = ZConfig.getString("db.mysql.dbname")
    val host: String = ZConfig.getString("db.mysql.host")
    val port = ZConfig.getInt("db.mysql.port")
    val username: String = ZConfig.getString("db.mysql.username")
    val password: String = ZConfig.getString("db.mysql.password")
    val generator = I32IdGenerator("share_service", "id", ssdb)
    val client = NativeJdbcClient(
      s"jdbc:mysql://$host:$port/$dbName?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
      username,
      password
    )
    MySqlShareRepository(client, ZConfig.getString("db.mysql.dbname"), ZConfig.getString("db.mysql.share_info_tbl"), generator)
  }
}

