package co.datainsider.bi.module

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.bi.domain.{ClickhouseConnection, SshConfig, SshKeyPair}
import co.datainsider.bi.engine.mysql.MysqlConnection
import co.datainsider.bi.engine.posgresql.PostgreSqlConnection
import co.datainsider.bi.engine.vertica.VerticaConnection
import co.datainsider.bi.service.{ConnectionService, MockConnectionService}
import co.datainsider.bi.util.{Using, ZConfig}
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.testcontainers.containers.DockerComposeContainer
import org.testcontainers.containers.wait.strategy.Wait

import java.io.File
import java.nio.charset.StandardCharsets
import scala.io.Source

/**
  * created 2023-04-25 10:03 AM
  *
  * @author tvc12 - Thien Vi
  */
object TestContainerModule extends TwitterModule {

  private val clickhouseServiceName: String = ZConfig.getString("test_environment.clickhouse.service_name")
  private val clickhouseHttpInterfacePort: Int = ZConfig.getInt("test_environment.clickhouse.http_interface_port")
  private val clickhouseNativeInterfacePort: Int = ZConfig.getInt("test_environment.clickhouse.native_interface_port")
  private val ssdbServiceName: String = ZConfig.getString("test_environment.ssdb.service_name")
  private val ssdbServicePort: Int = ZConfig.getInt("test_environment.ssdb.port")
  private val mysqlServiceName: String = ZConfig.getString("test_environment.mysql.service_name")
  private val mysqlServicePort: Int = ZConfig.getInt("test_environment.mysql.port")
  private val postgresServiceName: String = ZConfig.getString("test_environment.postgres.service_name")
  private val postgresServicePort: Int = ZConfig.getInt("test_environment.postgres.port")
//  private val redshiftServiceName: String = "redshift"
//  private val redshiftServicePort: Int = 5439

  private val verticaServiceName: String = ZConfig.getString("test_db.vertica.service_name")
  private val verticaServicePort: Int = ZConfig.getInt("test_db.vertica.service_port")
  private val openSshServiceName: String = ZConfig.getString("test_environment.openssh.service_name")
  private val openSshServicePort: Int = ZConfig.getInt("test_environment.openssh.port")

  private val dockerComposeFile = new File(getClass.getClassLoader.getResource("docker/docker-compose.yml").getPath)

  private val dockerContainer = new DockerComposeContainer(dockerComposeFile)

  dockerContainer.withExposedService(clickhouseServiceName, clickhouseHttpInterfacePort)
  dockerContainer.withExposedService(clickhouseServiceName, clickhouseNativeInterfacePort)
  dockerContainer.withExposedService(ssdbServiceName, ssdbServicePort)
  dockerContainer.withExposedService(mysqlServiceName, mysqlServicePort)
  dockerContainer.withExposedService(postgresServiceName, postgresServicePort)
  dockerContainer.withExposedService(verticaServiceName, verticaServicePort)
//  dockerContainer.withExposedService(redshiftServiceName, redshiftServicePort)
  dockerContainer.withExposedService(openSshServiceName, openSshServicePort)

  dockerContainer.waitingFor(verticaServiceName, Wait.forLogMessage(".*is now running.*", 1))
  dockerContainer.start()

  @Provides
  @Singleton
  @Named("mysql")
  def provideJdbcClient(@Named("mysql_jdbc_url") jdbcUrl: String): JdbcClient = {
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    NativeJDbcClient(jdbcUrl, user, password)
  }

  @Provides
  @Singleton
  @Named("clickhouse")
  def provideJdbcClient(source: ClickhouseConnection): JdbcClient = {
    NativeJDbcClient(
      jdbcUrl = source.toJdbcUrl,
      username = source.username,
      password = source.password
    )
  }

  @Provides
  @Singleton
  def providesClickhouseSource(): ClickhouseConnection = {
    val host = dockerContainer.getServiceHost(clickhouseServiceName, clickhouseHttpInterfacePort)
    val httpPort = dockerContainer.getServicePort(clickhouseServiceName, clickhouseHttpInterfacePort)
    val tcpPort = dockerContainer.getServicePort(clickhouseServiceName, clickhouseNativeInterfacePort)
//    val host = "localhost"
//    val httpPort = 8123
//    val tcpPort = 9000
    val username = "default"
    val password = ""
    val clusterName = ""
    ClickhouseConnection(
      orgId = 1,
      host = host,
      username = username,
      password = password,
      httpPort = httpPort,
      tcpPort = tcpPort,
      clusterName = Some(clusterName),
      useSsl = false
    )
  }

  @Provides
  @Singleton
  @Named("mysql_jdbc_url")
  def providesMysqlJdbcUrl(): String = {
    val host = dockerContainer.getServiceHost(mysqlServiceName, mysqlServicePort)
    val port = dockerContainer.getServicePort(mysqlServiceName, mysqlServicePort)
//    val host = "localhost"
//    val port = 3306
    s"jdbc:mysql://$host:$port?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
  }

  @Provides
  @Singleton
  @Named("clickhouse_jdbc_url")
  def providesClickhouseJdbcUrl(source: ClickhouseConnection): String = {
    source.toJdbcUrl
  }

  @Provides
  @Singleton
  def providesMysqlSource(): MysqlConnection = {
    val host = dockerContainer.getServiceHost(mysqlServiceName, mysqlServicePort)
    val port = dockerContainer.getServicePort(mysqlServiceName, mysqlServicePort)
//    val host = "localhost"
//    val port = 3306
    val username = ZConfig.getString("database.mysql.user")
    val password = ZConfig.getString("database.mysql.password")
    MysqlConnection(
      orgId = 1,
      host = host,
      port = port,
      username = username,
      password = password
    )
  }

  @Provides
  @Singleton
  def providesPostgreSqlSource(): PostgreSqlConnection = {
    val host = dockerContainer.getServiceHost(postgresServiceName, postgresServicePort)
    val port = dockerContainer.getServicePort(postgresServiceName, postgresServicePort)
//    val host = "localhost"
//    val port = 5432
    PostgreSqlConnection(
      orgId = 1,
      host = host,
      port = port,
      username = "tvc12",
      password = "di@123456",
      database = "thien_vi"
    )
  }

//  @Provides
//  @Singleton
//  def providesRedshiftSource(): RedshiftConnection = {
//    val host = dockerContainer.getServiceHost(redshiftServiceName, redshiftServicePort)
//    val port = dockerContainer.getServicePort(redshiftServiceName, redshiftServicePort)
//    RedshiftConnection(
//      orgId = 1,
//      host = host,
//      port = port,
//      username = "postgres",
//      password = "123456",
//      database = "postgres"
//    )
//  }

  @Provides
  @Singleton
  def provideConnectionService(clickhouseSource: ClickhouseConnection): ConnectionService = {
    MockConnectionService(clickhouseSource)
  }

  @Singleton
  @Provides
  def providesSSDB(): SSDB = {
    val host: String = dockerContainer.getServiceHost(ssdbServiceName, ssdbServicePort)
    val port: Int = dockerContainer.getServicePort(ssdbServiceName, ssdbServicePort)
//    val host: String = "localhost"
//    val port: Int = 8888
    val timeout: Int = ZConfig.getInt("ssdb.config.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)
  }

  @Singleton
  @Provides
  def providesVerticaConnection(): VerticaConnection = {
    VerticaConnection(
      orgId = 3,
      host = dockerContainer.getServiceHost(verticaServiceName, verticaServicePort),
      port = dockerContainer.getServicePort(verticaServiceName, verticaServicePort),
      username = ZConfig.getString("test_db.vertica.username"),
      password = ZConfig.getString("test_db.vertica.password"),
      catalog = ZConfig.getString("test_db.vertica.catalog", "")
    )
//    VerticaConnection(
//      orgId = 3,
//      host = "localhost",
//      port = 5433,
//      username = ZConfig.getString("test_db.vertica.username"),
//      password = ZConfig.getString("test_db.vertica.password"),
//      catalog = ZConfig.getString("test_db.vertica.catalog", "")
//    )
  }

  @Singleton
  @Provides
  def providesTunnelConfig(): SshConfig = {
    new SshConfig(
      host = dockerContainer.getServiceHost(openSshServiceName, openSshServicePort),
      port = dockerContainer.getServicePort(openSshServiceName, openSshServicePort),
//      host = "localhost",
//      port = 2222,
      username = ZConfig.getString("test_environment.openssh.username"),
      publicKey = providesKeyPair().publicKey
    )
  }

  @Singleton
  @Provides
  private def providesKeyPair(): SshKeyPair = {
    val publicKey = Using(getClass.getClassLoader.getResourceAsStream("docker/openssh/id_rsa.pub")) { inputStream =>
      Source.fromInputStream(inputStream, StandardCharsets.UTF_8.name()).mkString
    }
    val privateKey = Using(getClass.getClassLoader.getResourceAsStream("docker/openssh/id_rsa")) { inputStream =>
      Source.fromInputStream(inputStream, StandardCharsets.UTF_8.name()).mkString
    }
    SshKeyPair(
      orgId = 1,
      privateKey = privateKey,
      publicKey = publicKey,
      passphrase = "123456"
    )
  }
}
