package datainsider.data_cook.service

import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.query.SqlQuery
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.data_cook.service.table.EtlTableService
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.util.Implicits.FutureEnhance
import io.netty.util.internal.ThreadLocalRandom

import scala.util.Random

/**
  * @author tvc12 - Thien Vi
  * @created 09/24/2021 - 4:49 PM
  */
class EtlTableServiceTest extends IntegrationTest {
  override protected val injector: Injector = DiTestInjector(DataCookTestModule, TestModule).newInstance()
  private lazy val tableService = injector.instance[EtlTableService]

  private val orgId: OrganizationId = 1213
  private val etlId: EtlJobId = 2010
  private val names = Seq("Dog", "Cat", "Kitten", "Meo Meo", "Chicken", "Animal")

  def randomText() = {
    val index = ThreadLocalRandom.current().nextInt(0, names.length)
    names(index)
  }

  test("Test create schema") {
    val rawQuery = {
      s"select ${Random.nextInt()} as Id, '${randomText()}' as Text, now() as Date " ++
        Range(0, 100).map(_ => s"""
                                  |UNION ALL
                                  |select ${Random.nextInt()}, '${randomText()}', now()
            """.stripMargin).mkString("")
    }
    val query = SqlQuery(rawQuery)
    val destTableConfig = TableConfiguration(
      tblName = "testing",
      dbDisplayName = "Testing Database",
      tblDisplayName = "Testing Table"
    )
    val viewSchema: TableSchema = await(tableService.creatView(orgId, etlId, query, destTableConfig))
    assertResult(getDbName(orgId, etlId))(viewSchema.dbName)
    assertResult(destTableConfig.tblName)(viewSchema.name)
    assertResult(destTableConfig.tblDisplayName)(viewSchema.displayName)
  }

  test("Test create schema from other schema") {
    val fullTblName = s"${getDbName(orgId, etlId)}.testing"
    val query = SqlQuery(s"select Id as Id, Text as Name, now() as Date from $fullTblName where Id > 0")
    val destTableConfig = TableConfiguration(
      tblName = "table_2",
      dbDisplayName = "DB testing",
      tblDisplayName = "Table from a table"
    )
    val viewSchema: TableSchema = await(tableService.creatView(orgId, etlId, query, destTableConfig))
    assertResult(getDbName(orgId, etlId))(viewSchema.dbName)
    assertResult(destTableConfig.tblName)(viewSchema.name)
    assertResult(destTableConfig.tblDisplayName)(viewSchema.displayName)
  }

  test("remove tables") {
    val r = tableService.removeTables(orgId, etlId, Array("table_2", "testing")).syncGet()
    assertResult(true)(r)
  }

  test("Test drop schema") {
    val result = await(tableService.dropEtlDatabase(orgId, etlId))
    assertResult(true)(result)
  }
}
