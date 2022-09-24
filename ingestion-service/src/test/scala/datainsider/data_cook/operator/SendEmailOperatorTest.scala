package datainsider.data_cook.operator

import com.google.inject.name.Names
import com.twitter.util.logging.Logging
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.{GetOperator, GetOperatorExecutor, RootOperator, SendEmailOperator, SendEmailResult}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.ingestion.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SendEmailOperatorTest extends OperatorTest with Logging {
  override protected val jobId: EtlJobId = 3215
  private var bigOrderSchema: TableSchema = _
  protected val bigOrderTable: TableConfiguration = TableConfiguration(tblName = "trip_data", dbDisplayName = "Etl Operation", tblDisplayName = "Trip tables")
  private implicit val resolver = injector.instance[ExecutorResolver]

  override def beforeAll(): Unit = {
    super.beforeAll();
    bigOrderSchema = await(
      readFileAndCreateView(
        orgId,
        oldJobId,
        getClass.getClassLoader.getResource("datasets/tripdata.csv").getPath,
        Array("Duration","Start date","End date","Start station number","Start station","End station number","End station","Bike number","Member type"),
        bigOrderTable
      )
    )
  }


  test("Send email to 1 mail") {
    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_1", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("meomeocf98@gmail.com"), fileName = "tbl_1", subject = "Daily order records", content = Some("Hello"))

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)
  }

  test("Send email to 2 mail") {
    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_2", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("meomeocf98@gmail.com", "thienvc12.it@gmail.com"), fileName = "order daily report.csv", subject = "Daily order records 2")

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)

  }

  test("Send email to 1 mail with file name") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_3", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("meomeocf98@gmail.com"), fileName = "order daily", subject = "Daily order records")

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)
  }

  test("Send email to address not exist") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_4", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("tvc12@ohmypet.app"), fileName = "order.csv", subject = "Daily order records")

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult: SendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)

  }

  test("Send email with table not exist") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema.copy(name = "table_not_exists", dbName = "db_not_exist"), TableConfiguration("tbl_5", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("tvc12@ohmypet.app"), fileName = "order.csv", subject = "Daily order records")

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(false)(result.isSucceed)
    assertResult(true)(result.exception.isDefined)
    assertResult(true)(result.operatorError.isDefined)

    assertResult(getOperator)(result.operatorError.get)
    println(s"run pipeline failure, cause ${result.exception.get.getMessage}")
  }

  test("Send email with big table") {

    // RootOperator -> GetOperator -> SendEmailOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, bigOrderSchema, TableConfiguration("tbl_6", "ETL", "ETL"))
    val emailOperator = SendEmailOperator(2, Array("meomeocf98@gmail.com"), fileName = "daily user", subject = "Daily order records")
    resolver.register(GetOperatorExecutor(tableService, None, client))
    val pipeline = Pipeline.builder()
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
