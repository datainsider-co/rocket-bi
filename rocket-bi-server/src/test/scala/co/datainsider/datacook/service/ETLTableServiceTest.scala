//package co.datainsider.datacook.service
//
//import co.datainsider.bi.domain.query.SqlQuery
//import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
//import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
//import co.datainsider.datacook.domain._
//import co.datainsider.datacook.domain.operator.{DestTableConfig, GetDataOperator, SQLQueryOperator}
//import co.datainsider.datacook.engine.OperatorTest
//import co.datainsider.datacook.pipeline.ExecutorResolver
//import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
//import co.datainsider.datacook.service.worker.DataCookWorker
//import co.datainsider.schema.domain.TableSchema
//import com.twitter.util.{Duration, Future, FuturePool}
//import datainsider.client.domain.Implicits.ScalaFutureLike
//import datainsider.client.domain.scheduler.NoneSchedule
//import education.x.commons.SsdbKVS
//import io.netty.util.internal.ThreadLocalRandom
//import org.nutz.ssdb4j.spi.SSDB
//
//import java.util.concurrent.{Executors, TimeUnit}
//import scala.concurrent.ExecutionContext.Implicits.global
//import scala.util.Random
//
///**
//  * @author tvc12 - Thien Vi
//  * @created 09/24/2021 - 4:49 PM
//  */
//class ETLTableServiceTest extends OperatorTest {
//  override protected val jobId: EtlJobId = 2010
//  private val executorResolver = injector.instance[ExecutorResolver]
//
//  override val orgId: OrganizationId = 1218
//  private val names = Seq("Dog", "Cat", "Kitten", "Meo Meo", "Chicken", "Animal")
//  val destTableConfig = DestTableConfig(
//    tblName = "testing",
//    dbDisplayName = "Testing Database",
//    tblDisplayName = "Testing Table"
//  )
//
//  val serviceName = "data_cook.running_test_job"
//  private val kvs = new SsdbKVS[EtlJobId, Boolean](serviceName, injector.instance[SSDB])
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    val result: Boolean = await(tableService.dropETLDatabase(orgId, jobId))
//    println(s"drop database before all ${result}")
//  }
//
//  override protected val defaultAwaitTimeout = Duration(5, TimeUnit.MINUTES)
//
//  private val rawQuery = {
//    s"select ${Random.nextInt()} as Id, '${randomText()}' as Text, now() as Date " ++
//      Range(0, 100)
//        .map(_ => s"""
//           |UNION ALL
//           |select ${Random.nextInt()}, '${randomText()}', now()
//          """.stripMargin)
//        .mkString("")
//  }
//  private val query = SqlQuery(rawQuery)
//
//  def randomText() = {
//    val index = ThreadLocalRandom.current().nextInt(0, names.length)
//    names(index)
//  }
//
//  test("Test create schema") {
//
//    val destTableConfig = DestTableConfig(
//      tblName = "testing",
//      dbDisplayName = "Testing Database",
//      tblDisplayName = "Testing Table"
//    )
//    val viewSchema: TableSchema = await(tableService.createTable(orgId, jobId, query, destTableConfig))
//    assertResult(getDbName(orgId, jobId))(viewSchema.dbName)
//    assertResult(destTableConfig.tblName)(viewSchema.name)
//    assertResult(destTableConfig.tblDisplayName)(viewSchema.displayName)
//  }
//
//  test("Test create schema from other schema") {
//    val fullTblName = s"${getDbName(orgId, jobId)}.testing"
//    val query = SqlQuery(s"select Id as Id, Text as Name, now() as Date from $fullTblName where Id > 0")
//    val destTableConfig = DestTableConfig(
//      tblName = "table_2",
//      dbDisplayName = "DB testing",
//      tblDisplayName = "Table from a table"
//    )
//    val viewSchema: TableSchema = await(tableService.createTable(orgId, jobId, query, destTableConfig))
//    assertResult(getDbName(orgId, jobId))(viewSchema.dbName)
//    assertResult(destTableConfig.tblName)(viewSchema.name)
//    assertResult(destTableConfig.tblDisplayName)(viewSchema.displayName)
//  }
//
//  test("remove tables") {
//    val r = tableService.removeTables(orgId, jobId, Array("table_2", "testing")).syncGet()
//    assertResult(true)(r)
//  }
//
////  test("Test drop schema") {
////    val result = await(tableService.dropETLDatabase(orgId, jobId))
////    assertResult(true)(result)
////  }
//
//  val dropPoolAsync = FuturePool(Executors.newFixedThreadPool(24))
//
//  test("create and drop 20times") {
//
////    val result: Seq[Future[Unit]] = Range(0, 5000).map(jobId =>
////      async {
////        println(s"create etl time in jobId ${jobId}")
////        val fn: Seq[Future[TableSchema]] = Range(1, 2).map(destId => {
////          tableService.creatView(orgId, jobId, query, destTableConfig.copy(tblName = s"test_${destId}"))
////        })
////        await(Future.collect(fn))
////        println(s"create etl completed in jobId ${jobId}")
////      }
////    )
////    await(result)
//
//    val r = Range(0, 50).map(jobId =>
//      dropPoolAsync {
//        println(s"drop_test:: ${Thread.currentThread().getName} create etl in times ${jobId}")
//        await(tableService.createTable(orgId, jobId, query, destTableConfig))
//      }
//    )
//    val result: Seq[TableSchema] = await(Future.collect(r))
//    println(s"size is ${result.size}")
//    // drop
//    val r2 = Range(0, 50).map(jobId =>
//      dropPoolAsync {
//        println(s"drop_test:: ${Thread.currentThread().getName} drop etl in times ${jobId}")
//        await(tableService.dropETLDatabase(orgId, jobId))
//      }
//    )
//    await(Future.collect(r2))
//
//    Range(0, 50).foreach(jobId => {
//      println(s"drop etl completed in times ${jobId}")
//      val isNotExists = await(schemaService.isDatabaseExists(organizationId = orgId, dbName = getDbName(orgId, 0)))
//      assertResult(false)(isNotExists)
//    })
//
//  }
//
//  test("run job") {
//    val threads: Seq[Thread] = Range(10000, 10002).map(threadId => {
//      val thread = new Thread(() => {
//        println(s"worker id ${threadId}")
//        val worker = prepareWorker(threadId)
//        worker.run()
//      })
//      thread.start()
//      thread
//    })
//    ensureAllThreadsCompleted(threads)
//    await(schemaService.isDatabaseExists(organizationId = orgId, dbName = getDbName(orgId, 10001)))
//    await(schemaService.isDatabaseExists(organizationId = orgId, dbName = getDbName(orgId, 10002)))
//
//  }
//
//  private def ensureAllThreadsCompleted(threads: Seq[Thread]): Unit = {
//    threads.foreach(thread => {
//      thread.join()
//    })
//  }
//
//  private def prepareWorker(etlId: Long): DataCookWorker = {
//    val jobInfo = JobInfo(
//      historyId = 1,
//      job = EtlJob(
//        id = etlId,
//        organizationId = orgId,
//        displayName = "test",
//        operators = Array(
//          SQLQueryOperator(
//            operator = GetDataOperator(tableSchema = this.orderSchema),
//            query = rawQuery,
//            destTableConfiguration = destTableConfig
//          )
//        ),
//        ownerId = "",
//        scheduleTime = NoneSchedule(),
//        nextExecuteTime = 0,
//        status = ETLStatus.Running,
//        lastExecuteTime = None,
//        createdTime = None,
//        updatedTime = None,
//        lastHistoryId = None,
//        extraData = None,
//        operatorInfo = OperatorInfo(Map.empty, connections = Array.empty[(OperatorId, OperatorId)]),
//        config = EtlConfig()
//      )
//    )
//    kvs.add(etlId, true).asTwitter.syncGet()
//    val worker = new DataCookWorker(jobInfo, tableService, reportProgress, kvs, executorResolver)
//    worker
//  }
//
//  private def reportProgress(progress: EtlJobProgress): Future[Unit] =
//    Future {
//      println(s"jobId: ${progress.jobId} - progress: ${progress}")
//    }
//}
