package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.Limit
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.datacook.service.EmailService
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SendEmailOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 3215
  private val emailService = injector.instance[EmailService]

  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(
      SendEmailOperatorExecutor(
        // todo: don't known why localhost is not working but 127.0.0.1 is working
        source.copy(host = "127.0.0.1"),
        emailService,
        "./tmp/email"
      )
    )

  val tripTable: TableSchema = TableSchema(
    organizationId = orgId,
    dbName = sourceDbName,
    name = "tripdata",
    displayName = "Trip data",
    columns = Seq(
      Int64Column("Duration", "Duration"),
      DateTimeColumn("Start date", "Start date"),
      DateTimeColumn("End date", "End date"),
      Int64Column("Start station number", "Start station number"),
      StringColumn("start station", "start station"),
      Int64Column("End station number", "End station number"),
      StringColumn("End station", "End station"),
      StringColumn("Bike number", "Bike number"),
      StringColumn("Member type", "Member type")
    )
  )

  override def setupSampleTables(): Unit = {
    loadData(getClass.getClassLoader.getResource("datasets/tripdata.csv").getPath, tripTable)
    loadData(getClass.getClassLoader.getResource("datasets/sales.csv").getPath, salesTable)
  }

// todo: cmt test case cause maximum email send exceeded
//  test("Send email to 1 mail") {
//    // RootOperator -> GetOperator -> SendEmailOperator
//    val rootOperator = RootOperator(0)
//    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_1", "ETL", "ETL"))
//    val emailOperator = SendEmailOperator(
//      2,
//      Array("meomeocf98@gmail.com"),
//      fileName = "tbl_1",
//      subject = "Daily order records",
//      content = Some("Hello")
//    )
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator)
//      .add(getOperator, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//  }
//
//  test("Send email to 2 mail") {
//    // RootOperator -> GetOperator -> SendEmailOperator
//    val rootOperator = RootOperator(0)
//    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_2", "ETL", "ETL"))
//    val emailOperator = SendEmailOperator(
//      2,
//      Array("meomeocf98@gmail.com", "thienvc12.it@gmail.com"),
//      fileName = "order daily report.csv",
//      subject = "Daily order records 2"
//    )
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator)
//      .add(getOperator, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//
//  }
//
//  test("Send email to 1 mail with file name") {
//
//    // RootOperator -> GetOperator -> SendEmailOperator
//    val rootOperator = RootOperator(0)
//    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_3", "ETL", "ETL"))
//    val emailOperator =
//      SendEmailOperator(2, Array("meomeocf98@gmail.com"), fileName = "order daily", subject = "Daily order records")
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator)
//      .add(getOperator, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//  }
//
//  test("Send email to address not exist") {
//
//    // RootOperator -> GetOperator -> SendEmailOperator
//    val rootOperator = RootOperator(0)
//    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_4", "ETL", "ETL"))
//    val emailOperator =
//      SendEmailOperator(2, Array("tvc12@ohmypet.app"), fileName = "order.csv", subject = "Daily order records")
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator)
//      .add(getOperator, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//
//  }

  test("Send email with table not exist") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(
      1,
      salesTable.copy(name = "table_not_exists", dbName = "db_not_exist"),
      DestTableConfig("tbl_5", "ETL", "ETL")
    )
    val emailOperator =
      SendEmailOperator(2, Array("tvc12@ohmypet.app"), fileName = "order.csv", subject = "Daily order records")

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(false)(result.isSucceed)
    assertResult(true)(result.exception.isDefined)
    assertResult(true)(result.errorOperator.isDefined)

    assertResult(getOperator)(result.errorOperator.get)
    println(s"run pipeline failure, cause ${result.exception.get.getMessage}")
  }

  test("Send email with big table") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, tripTable, DestTableConfig("tbl_6", "ETL", "ETL"))
    val emailOperator =
      SendEmailOperator(2, Array("meomeocf98@gmail.com"), fileName = "daily user", subject = "Daily order records")
    resolver.register(GetOperatorExecutor(client, operatorService, None))
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()(resolver)

    val result: PipelineResult = pipeline.execute()

    assertResult(false)(result.isSucceed)
    assertResult(true)(result.exception.isDefined)

    println(s"run pipeline failure, cause ${result.exception.get.getMessage}")

  }
}
