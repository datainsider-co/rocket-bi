package co.datainsider.schema.module

import co.datainsider.bi.client.NativeJDbcClient
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.repository.{MySqlShareRepository, ShareRepository}
import co.datainsider.schema.service.{ShareService, ShareServiceImpl}
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB

object SchemaShareModule extends TwitterModule {

  override def configure(): Unit = {
    bind[ShareService].to[ShareServiceImpl].asEagerSingleton()
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
    val client = NativeJDbcClient(
      s"jdbc:mysql://$host:$port/$dbName?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
      username,
      password
    )
    MySqlShareRepository(
      client,
      ZConfig.getString("db.mysql.dbname"),
      ZConfig.getString("db.mysql.share_info_tbl"),
      generator
    )
  }
}
