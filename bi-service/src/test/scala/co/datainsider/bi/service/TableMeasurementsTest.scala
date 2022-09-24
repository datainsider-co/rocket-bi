package co.datainsider.bi.service

import co.datainsider.bi.domain.Order
import co.datainsider.bi.domain.chart.{SeriesChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{GroupBy, OrderBy, SelectExpr, Sum, TableField}
import co.datainsider.bi.domain.request.ChartRequest
import co.datainsider.bi.domain.response.SeriesOneResponse
import co.datainsider.bi.module.TestModule
import co.datainsider.query.DbTestUtils
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.module.MockCaasClientModule
import org.scalatest.FunSuite

class TableMeasurementsTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, MockCaasClientModule).newInstance()

  val queryService: QueryService = injector.instance[QueryService]

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertSales()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
  }

  test("test query series chart with Expression Field") {
    val chartRequest = ChartRequest(
      querySetting = SeriesChartSetting(
        xAxis = TableColumn(
          name = "Region",
          function = GroupBy(
            field = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Region", "String")
          )
        ),
        yAxis = Array(
          TableColumn(
            name = "UnitCost",
            function = Sum(
              field = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Unit_Cost", "Double")
            )
          ),
          TableColumn(
            name = "average_cost_usd",
            function = SelectExpr(
              expr = "(sum(Total_Cost) / count(Order_ID)) / 23000",
              aliasName = Some("average_cost_usd")
            )
          )
        ),
        breakdown = None,
        sorts = Array(
          OrderBy(
            function = SelectExpr(
              expr = "(sum(Total_Cost) / count(Order_ID)) / 23000",
              aliasName = Some("average_cost_usd")
            ),
            order = Order.DESC,
            numElemsShown = Some(3)
          )
        )
      )
    )

    val response = queryService.query(chartRequest).syncGet
    assert(response.isInstanceOf[SeriesOneResponse])
    assert(response.asInstanceOf[SeriesOneResponse].series.nonEmpty)
  }

}
