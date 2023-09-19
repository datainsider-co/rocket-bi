package co.datainsider.datacook.service

import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.Ids.JobHistoryId
import co.datainsider.datacook.domain.operator.{ExpressionFieldConfiguration, FieldType, NormalFieldConfiguration}
import co.datainsider.datacook.engine.DiTestInjector
import co.datainsider.datacook.module.TestDataCookModule
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaModule}
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 9:16 PM
  */
class ETLPreviewServiceTest extends IntegrationTest {
  private lazy val previewService = injector.instance[ETLPreviewService]

  override protected val injector: Injector = DiTestInjector(
    TestDataCookModule,
    TestContainerModule,
    TestModule,
    SchemaModule,
    MockCaasClientModule,
    MockSchemaClientModule
  ).newInstance()
  var jobId: JobHistoryId = _

  test("Get database name for preview with org: 1, id: 1") {
    val dbName: String = await(previewService.getDatabaseName(organizationId = 1, 1))

    assertResult("preview_etl_1")(dbName)
  }

  test("Get database name for preview org: 321, id: 123") {
    val dbName: String = await(previewService.getDatabaseName(organizationId = 321, 123))

    assertResult("preview_etl_123")(dbName)
  }

  test("Parse field to query") {
    val query: String = await(
      previewService.toQuery(
        organizationId = 1,
        id = 1,
        fields = Array(
          NormalFieldConfiguration(
            "Name Normal",
            field = TableField("test", "animal", "id", "")
          ),
          NormalFieldConfiguration(
            "Name as number 16",
            field = TableField("test", "animal", "name", ""),
            asType = Some(FieldType.Int16)
          )
        ),
        extraFields = Array(
          ExpressionFieldConfiguration(
            fieldName = "name_lower_case",
            displayName = "Name To Lower case",
            expression = "lower(name)"
          ),
          ExpressionFieldConfiguration(
            fieldName = "age",
            displayName = "age",
            expression = "lower(age)",
            asType = Some(FieldType.Int32)
          )
        )
      )
    )
    val expectedQuery =
      """select tbl_d796e7.`id` as `Name Normal`, cast(tbl_d796e7.`name` as Nullable(Int16)) as `Name as number 16`, lower(name) as `Name To Lower case`, cast(lower(age) as Nullable(Int32)) as `age`
        |from test.animal tbl_d796e7""".stripMargin

    assert(query.trim == expectedQuery.trim)
  }
}
