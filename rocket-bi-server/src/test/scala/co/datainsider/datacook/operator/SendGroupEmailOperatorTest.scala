package co.datainsider.datacook.operator

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query.Limit
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.datacook.service.EmailService
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, Int64Column, StringColumn}

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SendGroupEmailOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 3215

  private val emailService = injector.instance[EmailService]

  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(
      SendGroupEmailOperatorExecutor(
        engine,
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
    loadData(getClass.getClassLoader.getResource("datasets/orders.csv").getPath, orderTable)
  }

// todo: cmt test case cause maximum email send exceeded
//  test("Send multi file to email") {
//    val rootOperator = RootOperator(0)
//    val getOperator1 = GetOperator(1, salesTable, DestTableConfig("sales", "ETL", "ETL"))
//    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("orders", "ETL", "ETL"))
//    val emailOperator = SendGroupEmailOperator(
//      3,
//      Array("meomeocf98@gmail.com"),
//      fileNames = Seq("orders.csv", "sales.csv"),
//      subject = "Daily order records",
//      content = Some("Sample Sales")
//    )
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator1)
//      .add(rootOperator, getOperator2)
//      .add(getOperator1, emailOperator)
//      .add(getOperator2, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//  }
//
//  test("Send multi file to email using zip") {
//    val rootOperator = RootOperator(0)
//    val getOperator1 = GetOperator(1, salesTable, DestTableConfig("sales_1", "ETL", "ETL"))
//    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("orders_1", "ETL", "ETL"))
//    val emailOperator = SendGroupEmailOperator(
//      3,
//      Array("meomeocf98@gmail.com"),
//      fileNames = Seq.empty,
//      subject = "Daily order records as zip",
//      content = None,
//      isZip = true
//    )
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator1)
//      .add(rootOperator, getOperator2)
//      .add(getOperator1, emailOperator)
//      .add(getOperator2, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//  }
//
//  test("Send multi file excel to email") {
//    val rootOperator = RootOperator(0)
//    val getOperator1 = GetOperator(1, salesTable, DestTableConfig("sales_11", "ETL", "ETL"))
//    val emailOperator = SendGroupEmailOperator(
//      2,
//      Array("meomeocf98@gmail.com"),
//      fileNames = Seq("sales_2.xlsx"),
//      subject = "Daily order records excel",
//      content = None,
//      fileType = FileType.Excel
//    )
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator1)
//      .add(getOperator1, emailOperator)
//      .build()
//
//    val result: PipelineResult = pipeline.execute()
//
//    assertResult(true)(result.isSucceed)
//    assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]
//
//    assertResult(true)(sendEmailResult != null)
//    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//    assert(sendEmailResult.attachmentSize > 0)
//  }
//
//
//  test("Send multi file excel to email using zip") {
//      val rootOperator = RootOperator(0)
//      val getOperator1 = GetOperator(1, salesTable, DestTableConfig("sales_12", "ETL", "ETL"))
//      val getOperator2 = GetOperator(2, orderTable, DestTableConfig("orders_12", "ETL", "ETL"))
//      val emailOperator = SendGroupEmailOperator(
//        3,
//        Array("meomeocf98@gmail.com"),
//        fileNames = Seq.empty,
//        subject = "Daily order records excel as zip",
//        content = None,
//        isZip = true,
//        fileType = FileType.Excel
//      )
//
//      val pipeline = Pipeline
//        .builder()
//        .setJobId(jobId)
//        .setOrganizationId(orgId)
//        .add(rootOperator, getOperator1)
//        .add(rootOperator, getOperator2)
//        .add(getOperator1, emailOperator)
//        .add(getOperator2, emailOperator)
//        .build()
//
//      val result: PipelineResult = pipeline.execute()
//
//      assertResult(true)(result.isSucceed)
//      assertResult(result.mapResult.contains(emailOperator.id))(true)
//
//      val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]
//
//      assertResult(true)(sendEmailResult != null)
//      assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
//      assert(sendEmailResult.attachmentSize > 0)
//    }

//  test("Send multi file to email with big file") {
//    val rootOperator = RootOperator(0)
//    val getOperator1 = GetOperator(1, salesTable, DestTableConfig("sales_2", "ETL", "ETL"))
//    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("orders_2", "ETL", "ETL"))
//    val getOperator3 = GetOperator(3, tripTable, DestTableConfig("big_orders_2", "ETL", "ETL"))
//    val emailOperator = SendGroupEmailOperator(
//      4,
//      Array("meomeocf98@gmail.com"),
//      fileNames = Seq("sales_2.csv", "orders_2.csv", "big_orders_2.csv"),
//      subject = "Daily order records",
//      content = Some("Sample Sales")
//    )
//    resolver.register(GetOperatorExecutor(client, operatorService, None))
//
//    val pipeline = Pipeline
//      .builder()
//      .setJobId(jobId)
//      .setOrganizationId(orgId)
//      .add(rootOperator, getOperator1)
//      .add(rootOperator, getOperator2)
//      .add(rootOperator, getOperator3)
//      .add(getOperator1, emailOperator)
//      .add(getOperator2, emailOperator)
//      .add(getOperator3, emailOperator)
//      .build()(resolver)
//
//    val result: PipelineResult = pipeline.execute()
//    println(s"Send multi file result ${result}")
//    assertResult(false)(result.isSucceed)
//    assertResult(true)(result.exception.isDefined)
//  }
}
