package datainsider.data_cook.service

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.domain.query.TableField
import datainsider.client.exception.{DbNotFoundError, NotFoundError}
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.Ids.JobHistoryId
import datainsider.data_cook.domain.operator.{ExpressionFieldConfiguration, FieldType, NormalFieldConfiguration}
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.ingestion.module.TestModule

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 9:16 PM
  */
class PreviewEtlJobServiceTest extends IntegrationTest {
  private lazy val previewService = injector.instance[PreviewEtlJobService]

  override protected val injector: Injector =
    DiTestInjector(DataCookTestModule, TestModule, MockCaasClientModule).newInstance()
  var jobId: JobHistoryId = _


  test("End Session Preview") {
    val result: Future[Boolean] = previewService.endPreview(organizationId = 1, 1)

    assertFailedFuture[DbNotFoundError](result)
  }


  test("Get database name for preview with org: 1, id: 1") {
    val dbName: String = await(previewService.getDatabaseName(organizationId = 1, 1))

    assertResult("org1_preview_etl_1")(dbName)
  }

  test("Get database name for preview org: 321, id: 123") {
    val dbName: String = await(previewService.getDatabaseName(organizationId = 321, 123))

    assertResult("org321_preview_etl_123")(dbName)
  }

  test("Parse field to query") {
    val query: String = await(
      previewService.toQuery(
        organizationId = 1,
        id = 1,
        fields = Array(
          NormalFieldConfiguration(
            "Name as number 16",
            field = TableField("test", "animal", "id", "")
          ),
          NormalFieldConfiguration(
            "Name as number 16",
            field = TableField("test", "animal", "name", ""),
            asType = Some(FieldType.Int16)
          )
        ),
        extraFields = Array(
          ExpressionFieldConfiguration("name_lower_case", "Name To Lower case", "lower(name)")
        )
      )
    )
    val expectedQuery =
      """select test.animal.`id` as "Name as number 16", cast(test.animal.`name` as Nullable(Int16)) as "Name as number 16", lower(name) as "Name To Lower case"
        |from test.animal""".stripMargin

    assertResult(query)(expectedQuery)
  }
}
