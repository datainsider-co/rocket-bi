//package co.datainsider.bi.service
//
//import co.datainsider.bi.domain.Order
//import co.datainsider.bi.domain.chart.{SeriesChartSetting, TableColumn}
//import co.datainsider.bi.domain.query._
//import co.datainsider.bi.domain.request.ChartRequest
//import co.datainsider.bi.domain.response.SeriesOneResponse
//import co.datainsider.bi.module.TestModule
//import co.datainsider.bi.utils.DbTestUtils
//import co.datainsider.caas.user_profile.module.MockCaasClientModule
//import co.datainsider.bi.module.MockBIClientModule
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import co.datainsider.bi.util.Implicits.FutureEnhance
//
//class TableMeasurementsTest extends IntegrationTest {
//  override protected def injector: Injector =
//    TestInjector(TestModule, MockCaasClientModule, MockBIClientModule).newInstance()
//
//  val queryService: QueryService = injector.instance[QueryService]
//
//  override def beforeAll(): Unit = {
//    DbTestUtils.setUpTestDb()
//    DbTestUtils.insertSales()
//  }
//
//  override def afterAll(): Unit = {
//    DbTestUtils.cleanUpTestDb()
//  }
//
//  test("test query series chart with Expression Field") {
//    val chartRequest = ChartRequest(
//      querySetting = SeriesChartSetting(
//        xAxis = TableColumn(
//          name = "Region",
//          function = GroupBy(
//            field = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Region", "String")
//          )
//        ),
//        yAxis = Array(
//          TableColumn(
//            name = "UnitCost",
//            function = Sum(
//              field = TableField(DbTestUtils.dbName, DbTestUtils.tblSales, "Unit_Cost", "Double")
//            )
//          ),
//          TableColumn(
//            name = "average_cost_usd",
//            function = SelectExpr(
//              expr = "(sum(Total_Cost) / count(Order_ID)) / 23000",
//              aliasName = Some("average_cost_usd")
//            )
//          )
//        ),
//        breakdown = None,
//        sorts = Array(
//          OrderBy(
//            function = SelectExpr(
//              expr = "(sum(Total_Cost) / count(Order_ID)) / 23000",
//              aliasName = Some("average_cost_usd")
//            ),
//            order = Order.DESC,
//            numElemsShown = Some(3)
//          )
//        )
//      )
//    )
//
//    val response = queryService.query(chartRequest).syncGet
//    assert(response.isInstanceOf[SeriesOneResponse])
//    assert(response.asInstanceOf[SeriesOneResponse].series.nonEmpty)
//  }
//
//}
