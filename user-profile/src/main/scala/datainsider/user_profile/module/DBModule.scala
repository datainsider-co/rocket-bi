package datainsider.user_profile.module

import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import datainsider.client.util.{HikariClient, JdbcClient, NativeJdbcClient, ZConfig}
import datainsider.user_profile.module.DBTestModule.testContainer
import education.x.util.DataSourceBuilder
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.testcontainers.containers.{DockerComposeContainer, MySQLContainer}
import org.testcontainers.utility.DockerImageName

import java.io.File
import javax.inject.{Named, Singleton}
import javax.sql.DataSource

/**
  * @author sonpn
  */

object DBModule extends TwitterModule {

  @Provides
  @Singleton
  def providesDataSource(): DataSource = {
    val dbName: String = ZConfig.getString("db.mysql.dbname")
    val host: String = ZConfig.getString("db.mysql.host")
    val port: Int = ZConfig.getInt("db.mysql.port")
    val username: String = ZConfig.getString("db.mysql.username")
    val password: String = ZConfig.getString("db.mysql.password")
    DataSourceBuilder
      .hikari()
      .driver("com.mysql.cj.jdbc.Driver")
      .jdbcUrl(
        s"jdbc:mysql://$host:$port/$dbName?useUnicode=true&amp&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
      )
      .username(username)
      .password(password)
      .build()
  }

  @Singleton
  @Provides
  @Named("caas_jdbc_client")
  def providesJdbcClient(): JdbcClient = {
    val host: String = ZConfig.getString("db.mysql.host")
    val port: Int = ZConfig.getInt("db.mysql.port")
    val dbName: String = ZConfig.getString("db.mysql.dbname")

    val jdbcUrl =
      s"jdbc:mysql://$host:$port/$dbName?useUnicode=true&amp&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
    val username: String = ZConfig.getString("db.mysql.username")
    val password: String = ZConfig.getString("db.mysql.password")

    HikariClient(jdbcUrl, username, password)
  }

  @Singleton
  @Provides
  @Named("global_jdbc_client")
  def providesGlobalJdbcClient(): JdbcClient = {
    val host: String = ZConfig.getString("db.mysql.host")
    val port: Int = ZConfig.getInt("db.mysql.port")
    val jdbcUrl =
      s"jdbc:mysql://$host:$port?useUnicode=true&amp&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
    val username: String = ZConfig.getString("db.mysql.username")
    val password: String = ZConfig.getString("db.mysql.password")

    HikariClient(jdbcUrl, username, password)
  }

  @Singleton
  @Provides
  def providesSSDB(): SSDB = {
    SSDBs.pool(
      ZConfig.getString("db.ssdb.host"),
      ZConfig.getInt("db.ssdb.port"),
      ZConfig.getInt("db.ssdb.timeout_in_ms"),
      null
    )
  }

}

object DBTestModule extends TwitterModule {

  val mysqlContainer = new MySQLContainer(DockerImageName.parse("mysql:5.7"))
  mysqlContainer.withUsername(ZConfig.getString("test_db.mysql.username"))
  mysqlContainer.withPassword(ZConfig.getString("test_db.mysql.password"))
  mysqlContainer.withDatabaseName(ZConfig.getString("test_db.mysql.dbname"))
  mysqlContainer.start()

  val testContainer = new DockerComposeContainer(new File("./env/test/docker-compose.yml"))
  testContainer.withExposedService("ssdb", 8888)

  testContainer.start()

  @Provides
  @Singleton
  def providesDataSource(): DataSource = {

    DataSourceBuilder
      .hikari()
      .driver("com.mysql.cj.jdbc.Driver")
      .jdbcUrl(mysqlContainer.getJdbcUrl)
      .username(mysqlContainer.getUsername)
      .password(mysqlContainer.getPassword)
      .build()

  }

  @Singleton
  @Provides
  @Named("caas_jdbc_client")
  def providesJdbcClient(): JdbcClient = {
    NativeJdbcClient(mysqlContainer.getJdbcUrl, mysqlContainer.getUsername, mysqlContainer.getPassword)
  }

  @Singleton
  @Provides
  @Named("global_jdbc_client")
  def providesGlobalJdbcClient(): JdbcClient = {
    NativeJdbcClient(mysqlContainer.getJdbcUrl, mysqlContainer.getUsername, mysqlContainer.getPassword)
  }

  @Singleton
  @Provides
  def providesSSDB(): SSDB = {
    SSDBs.pool(
      testContainer.getServiceHost("ssdb", 8888),
      testContainer.getServicePort("ssdb", 8888),
      ZConfig.getInt("test_db.ssdb.timeout_in_ms"),
      null
    )
  }

}
