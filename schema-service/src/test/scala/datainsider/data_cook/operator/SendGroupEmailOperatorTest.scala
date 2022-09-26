package datainsider.data_cook.operator

import com.google.inject.name.Names
import com.twitter.util.logging.Logging
import datainsider.client.util.JdbcClient
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator._
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.ingestion.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SendGroupEmailOperatorTest extends OperatorTest with Logging {
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

  test("Send multi file to email") {
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales", "ETL", "ETL"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("orders", "ETL", "ETL"))
    val emailOperator = SendGroupEmailOperator(3, Array("meomeocf98@gmail.com"), fileNames = Seq("orders.csv", "sales.csv"), subject = "Daily order records", content = Some("Sample Sales"))

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, emailOperator)
      .add(getOperator2, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)
  }

  test("Send multi file to email using zip") {
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales", "ETL", "ETL"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("orders", "ETL", "ETL"))
    val emailOperator = SendGroupEmailOperator(3, Array("meomeocf98@gmail.com"), fileNames = Seq.empty, subject = "Daily order records as zip", content = None, isZip = true)

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, emailOperator)
      .add(getOperator2, emailOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    assertResult(result.mapResult.contains(emailOperator.id))(true)

    val sendEmailResult = result.mapResult(emailOperator.id).asInstanceOf[SendGroupEmailResult]

    assertResult(true)(sendEmailResult != null)
    assertResult(true)(sendEmailResult.response.statusCode >= 200 || sendEmailResult.response.statusCode <= 300)
    assert(sendEmailResult.attachmentSize > 0)
  }

  test("Send multi file to email with big file") {
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales", "ETL", "ETL"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("orders", "ETL", "ETL"))
    val getOperator3 = GetOperator(3, bigOrderSchema, TableConfiguration("big_orders", "ETL", "ETL"))
    val emailOperator = SendGroupEmailOperator(4, Array("meomeocf98@gmail.com"), fileNames = Seq("orders.csv", "sales.csv", "big_orders"), subject = "Daily order records", content = Some("Sample Sales"))
    resolver.register(GetOperatorExecutor(tableService, None, client))
    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(rootOperator, getOperator3)
      .add(getOperator1, emailOperator)
      .add(getOperator2, emailOperator)
      .add(getOperator3, emailOperator)
      .build()(resolver)

    val result: PipelineResult = pipeline.execute()
    println(s"Send multi file result ${result}")
    assertResult(false)(result.isSucceed)
    assertResult(true)(result.exception.isDefined)
  }
}
