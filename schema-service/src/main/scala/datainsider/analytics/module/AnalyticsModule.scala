package datainsider.analytics.module

import akka.actor.{ActorRef, ActorSystem, Props}
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.analytics.domain.AnalyticsConfig
import datainsider.analytics.repository._
import datainsider.analytics.service.{BaseScheduleQueue, OnScheduledTrigger, _}
import datainsider.client.service.OrgClientService
import datainsider.client.util.{HikariClient, JdbcClient, ZConfig}
import education.x.commons.SsdbSortedSet
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Named

@deprecated("no longer used")
object AnalyticsModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()

    bind[JobFactory].to[JobFactoryImpl].asEagerSingleton()
    bind[JobInfoService].to[JobInfoServiceImpl].asEagerSingleton()

    bind[OnScheduledTrigger].to[OrganizationReportsTrigger].asEagerSingleton()
    bind[JobManagementService].to[JobManagementServiceImpl].asEagerSingleton()
  }

  @Provides
  @Singleton
  @Named("mysql")
  def providesMySQLClient(): JdbcClient = {
    val dbName: String = ZConfig.getString("db.mysql.dbname")
    val host: String = ZConfig.getString("db.mysql.host")
    val port = ZConfig.getInt("db.mysql.port")
    val username: String = ZConfig.getString("db.mysql.username")
    val password: String = ZConfig.getString("db.mysql.password")

    HikariClient(
      s"jdbc:mysql://$host:$port/$dbName?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
      username,
      password
    )
  }

//  @Provides
//  @Singleton
//  def providesActiveUserRepository(
//      analyticsConfig: AnalyticsConfig,
//      @Named("clickhouse") client: JdbcClient
//  ): ReportDataRepository = {
//    ClickHouseReportDataRepository(analyticsConfig, client)
//  }

//  @Provides
//  @Singleton
//  def providesJobInfoRepository(@Named("mysql") client: JdbcClient): JobInfoRepository = {
//    val jobInfoTbl = ZConfig.getString("db.mysql.job_info_tbl")
//    JobInfoRepositoryImpl(client, jobInfoTbl)
//  }

//  @Provides
//  @Singleton
//  @Named("job_runner_actor")
//  def providesJobRunnerActor(
//      system: ActorSystem,
//      config: AnalyticsConfig,
//      @Named("clickhouse") clickHouseClient: JdbcClient,
//      jobInfoService: JobInfoService,
//      organizationService: OrgClientService,
//      activeUserRepository: ReportDataRepository
//  ): ActorRef = {
//    system.actorOf(
//      Props(
//        classOf[JobRunnerActor],
//        config,
//        clickHouseClient,
//        jobInfoService,
//        organizationService,
//        activeUserRepository
//      ),
//      JobRunnerActor.getClass.getSimpleName
//    )
//  }

//  @Provides
//  @Singleton
//  @Named("job_scheduler_actor")
//  def providesJobScheduler(
//      system: ActorSystem,
//      jobFactory: JobFactory,
//      organizationService: OrgClientService,
//      jobInfoService: JobInfoService,
//      queue: BaseScheduleQueue,
//      @Named("job_runner_actor") jobRunnerActor: ActorRef
//  ): ActorRef = {
//    system.actorOf(
//      Props(
//        classOf[JobScheduler],
//        jobFactory,
//        organizationService,
//        jobInfoService,
//        queue,
//        jobRunnerActor
//      ),
//      JobScheduler.getClass.getSimpleName
//    )
//  }

//  @Provides
//  @Singleton
//  def providesScheduledOrganizationQueue(client: SSDB, onScheduledTrigger: OnScheduledTrigger): BaseScheduleQueue = {
//    val queue = SsdbSortedSet("analytics_report.queue.org_by_timezone", client)
//    TimeBasedScheduleQueue(queue, onScheduledTrigger)
//  }

}
