package datainsider.jobworker.module

import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.util.ZConfig
import datainsider.jobworker.client.{HikariClient, HttpClient, JdbcClient, SimpleHttpClient}
import datainsider.jobworker.domain.{DatabaseType, JdbcSource}
import datainsider.jobworker.repository.{
  DataSourceRepository,
  HttpScheduleRepository,
  MockHttpSourceRepository,
  ScheduleRepository
}
import datainsider.jobworker.service.{MetadataService, MetadataServiceImpl, MockRunnableJobFactory, RunnableJobFactory}
import datainsider.jobworker.util.InsertMockData
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.testcontainers.containers.DockerComposeContainer
import org.testcontainers.containers.localstack.LocalStackContainer
import org.testcontainers.containers.localstack.LocalStackContainer.Service
import org.testcontainers.utility.DockerImageName

import java.io.File

object TestModule extends TwitterModule {
  override def configure: Unit = {
    //bindSingleton[WorkerService].to[SimpleWorkerService]
    //bindSingleton[ScheduleService].to[ScheduleServiceImpl]
    bindSingleton[ScheduleRepository].to[HttpScheduleRepository]
    bindSingleton[DataSourceRepository].to[MockHttpSourceRepository]
  }

  val clickhouseContainer = new DockerComposeContainer(new File("./env/test/clickhouse/docker-compose.yml"))
  val clickhouseServiceName: String = ZConfig.getString("database_test.clickhouse.service_name")
  val clickhouseHttpInterfacePort: Int = ZConfig.getInt("database_test.clickhouse.http_interface_port")
  val clickhouseNativeInterfacePort: Int = ZConfig.getInt("database_test.clickhouse.native_interface_port")
  clickhouseContainer.withExposedService(clickhouseServiceName, clickhouseHttpInterfacePort)
  clickhouseContainer.withExposedService(clickhouseServiceName, clickhouseNativeInterfacePort)
  clickhouseContainer.start()

  val ssdbContainer = new DockerComposeContainer(new File("./env/test/ssdb/docker-compose.yml"))
  val ssdbServiceName: String = ZConfig.getString("database_test.ssdb.service_name")
  val ssdbServicePort: Int = ZConfig.getInt("database_test.ssdb.port")
  ssdbContainer.withExposedService(ssdbServiceName, ssdbServicePort)
  ssdbContainer.start()

  startMysqlContainer()
  startMssqlContainer()
  startPostgresContainer()
  insertMysqlMockData()
  insertMssqlMockData()
  insertPostgresMockData()

  @Provides
  @Singleton
  @Named("clickhouse")
  def provideClickhouseClient(): JdbcClient = {
    val host: String = clickhouseContainer.getServiceHost(clickhouseServiceName, clickhouseNativeInterfacePort)
    val port: Int = clickhouseContainer.getServicePort(clickhouseServiceName, clickhouseNativeInterfacePort)
    val jdbcUrl: String = s"jdbc:clickhouse://$host:$port"
    val user: String = ZConfig.getString("database_config.clickhouse.username")
    val password: String = ZConfig.getString("database_config.clickhouse.password")
    HikariClient(jdbcUrl, user, password)
//    HikariClient("jdbc:clickhouse://127.0.0.1:8123", "default", "")
  }

  @Provides
  @Singleton
  def provideDestinationSource: JdbcSource = {
    val host: String = clickhouseContainer.getServiceHost(clickhouseServiceName, clickhouseNativeInterfacePort)
    val port: Int = clickhouseContainer.getServicePort(clickhouseServiceName, clickhouseNativeInterfacePort)
    val url: String = s"jdbc:clickhouse://$host:$port"
    val username = ZConfig.getString("database_config.clickhouse.username")
    val password = ZConfig.getString("database_config.clickhouse.password")
    JdbcSource(
      1,
      1,
      "clickhouse local",
      DatabaseType.MySql,
      url,
      username,
      password
    )
  }

  @Provides
  @Singleton
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("scheduler_host")
    new SimpleHttpClient(apiHost)
  }

  @Singleton
  @Provides
  @Named("access-token")
  def provideAccessToken(): String = {
    ZConfig.getString("access_token", "job$cheduler@datainsider.co")
  }

  @Singleton
  @Provides
  def provideSSDB: SSDB = {
    val host: String = ssdbContainer.getServiceHost(ssdbServiceName, ssdbServicePort)
    val port: Int = ssdbContainer.getServicePort(ssdbServiceName, ssdbServicePort)
    val timeout: Int = ZConfig.getInt("database_config.ssdb.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)
//    SSDBs.pool("localhost", 8888, 60000, null)
  }

  @Singleton
  @Provides
  def provideSSDBKVS(client: SSDB): SsdbKVS[Long, Boolean] = {
    val dbName: String = ZConfig.getString("database_config.ssdb.db_name")
    SsdbKVS[Long, Boolean](dbName, client)
  }

  def startMysqlContainer(): Unit = {
    val mysqlContainer = new DockerComposeContainer(new File("./env/test/mysql/docker-compose.yml"))
    val mysqlServiceName: String = ZConfig.getString("database_test.mysql.service_name")
    val mysqlServicePort: Int = ZConfig.getInt("database_test.mysql.service_port")
    mysqlContainer.withExposedService(mysqlServiceName, mysqlServicePort)
    mysqlContainer.start()
  }

  def startMssqlContainer(): Unit = {
    val mssqlContainer = new DockerComposeContainer(new File("./env/test/mssql/docker-compose.yml"))
    val mssqlServiceName: String = ZConfig.getString("database_test.mssql.service_name")
    val mssqlServicePort: Int = ZConfig.getInt("database_test.mssql.service_port")
    mssqlContainer.withExposedService(mssqlServiceName, mssqlServicePort)
    mssqlContainer.start()
  }

  def startPostgresContainer(): Unit = {
    val postgresContainer = new DockerComposeContainer(new File("./env/test/postgres/docker-compose.yml"))
    val postgresServiceName: String = ZConfig.getString("database_test.postgres.service_name")
    val postgresServicePort: Int = ZConfig.getInt("database_test.postgres.service_port")
    postgresContainer.withExposedService(postgresServiceName, postgresServicePort)
    postgresContainer.start()
  }

  def insertMysqlMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("database_test.mysql.url")
    val username: String = ZConfig.getString("database_test.mysql.username")
    val password: String = ZConfig.getString("database_test.mysql.password")
    InsertMockData.insertMysqlMockData(jdbcUrl, username, password)
  }

  def insertMssqlMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("database_test.mssql.url")
    val username: String = ZConfig.getString("database_test.mssql.username")
    val password: String = ZConfig.getString("database_test.mssql.password")
    InsertMockData.insertMssqlMockData(jdbcUrl, username, password)
  }

  def insertPostgresMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("database_test.postgres.url")
    val username: String = ZConfig.getString("database_test.postgres.username")
    val password: String = ZConfig.getString("database_test.postgres.password")
    InsertMockData.insertPostgresMockData(jdbcUrl, username, password)
  }

  @Provides
  @Singleton
  def provideS3Client(): AmazonS3 = {
    val localstackImage: DockerImageName = DockerImageName.parse("localstack/localstack:0.14.2")
    val localstack: LocalStackContainer = new LocalStackContainer(localstackImage)
    localstack.withServices(Service.S3)
    localstack.start()

    val s3Client: AmazonS3 = AmazonS3ClientBuilder
      .standard()
      .withEndpointConfiguration(localstack.getEndpointConfiguration(Service.S3))
      .withCredentials(localstack.getDefaultCredentialsProvider)
      .build()

    val bucketName = "products"
    val fileKey = "products.csv"
    val filePath = "./data/products.csv"
    s3Client.createBucket(bucketName)
    s3Client.putObject(bucketName, fileKey, new File(filePath))

    s3Client
  }

  @Singleton
  @Provides
  def provideMetaService(dataSourceRepository: DataSourceRepository): MetadataService = {
    val shopifyClientId: String = ZConfig.getString("shopify.client_id")
    val shopifyClientSecret: String = ZConfig.getString("shopify.client_secret")
    new MetadataServiceImpl(dataSourceRepository, shopifyClientId, shopifyClientSecret)
  }
}
