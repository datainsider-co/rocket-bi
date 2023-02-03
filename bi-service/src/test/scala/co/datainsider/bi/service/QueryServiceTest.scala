package co.datainsider.bi.service

import co.datainsider.bi.domain.{
  AttributeBasedOperator,
  CompareMode,
  FieldPair,
  Order,
  Relationship,
  RelationshipInfo,
  RlsPolicy,
  UserAttribute
}
import co.datainsider.bi.domain.chart.{
  FlattenPivotTableSetting,
  GroupTableChartSetting,
  HistogramChartSetting,
  NumberChartSetting,
  PieChartSetting,
  PivotTableSetting,
  TableChartSetting,
  TableColumn
}
import co.datainsider.bi.domain.query.{
  AlwaysTrue,
  CalculatedField,
  Count,
  CountAll,
  CurrentQuarter,
  Equal,
  ExpressionField,
  GroupBy,
  LessThan,
  Max,
  Min,
  OrderBy,
  PastNYear,
  Select,
  SelectExpression,
  SqlQuery,
  SqlView,
  Sum,
  TableField,
  TableView,
  ViewField
}
import co.datainsider.bi.domain.request.{ChartRequest, CompareRequest, FilterRequest}
import co.datainsider.bi.domain.response.{JsonTableResponse, SeriesOneResponse, SeriesTwoResponse}
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.query.DbTestUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.filter.MockUserContext
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.JsonParser

class QueryServiceTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, MockCaasClientModule).newInstance()
  val schemaManager = injector.instance[SchemaManager]
  val queryService: QueryService = injector.instance[QueryService]
  val relationshipService: RelationshipService = injector.instance[RelationshipService]
  val rlsPolicyService: RlsPolicyService = injector.instance[RlsPolicyService]

  val orgId = 0L
  val firstUser = "test_tbl_relationship_user"
  val secondUser = "test_rls_user"
  val dashboardId = 0L
  var createdPolicyId = 0L
  val mockRelationshipRequest = MockUserContext.getLoggedInRequest(orgId, firstUser)
  val mockRlsRequest = MockUserContext.getLoggedInRequest(orgId, secondUser)

  val dbName: String = DbTestUtils.dbName
  val tblCustomers: String = DbTestUtils.tblCustomers
  val tblProducts: String = DbTestUtils.tblProducts
  val tblOrder: String = DbTestUtils.tblOrders
  val tblSales: String = DbTestUtils.tblSales

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertFakeData()
    schemaManager.ensureDatabase()
    Await.result(
      relationshipService.createOrUpdate(
        orgId,
        dashboardId,
        RelationshipInfo(
          views = Seq(
            TableView(dbName, tblCustomers),
            TableView(dbName, tblOrder),
            TableView(dbName, tblProducts)
          ),
          relationships = Seq(
            Relationship(
              firstView = TableView(dbName, tblCustomers),
              secondView = TableView(dbName, tblOrder),
              fieldPairs = Seq(
                FieldPair(
                  TableField(dbName, tblCustomers, "id", "UInt32"),
                  TableField(dbName, tblOrder, "customer_id", "UInt32")
                )
              )
            ),
            Relationship(
              firstView = TableView(dbName, tblProducts),
              secondView = TableView(dbName, tblOrder),
              fieldPairs = Seq(
                FieldPair(
                  TableField(dbName, tblProducts, "id", "UInt32"),
                  TableField(dbName, tblOrder, "product_id", "UInt32")
                )
              )
            )
          )
        )
      )
    )

    val createdPolicy: RlsPolicy = Await.result(
      rlsPolicyService.create(
        orgId,
        RlsPolicy(
          orgId = orgId,
          userIds = Seq(secondUser),
          userAttribute = Some(
            UserAttribute(
              operator = AttributeBasedOperator.Equal,
              key = "department",
              values = Seq("IT")
            )
          ),
          dbName = dbName,
          tblName = tblCustomers,
          conditions = Array(Equal(TableField(dbName, tblCustomers, "name", "String"), "Ronaldo"))
        )
      )
    )

    createdPolicyId = createdPolicy.policyId
  }

  override def afterAll(): Unit = {
    Await.result(relationshipService.delete(orgId, dashboardId))
    Await.result(rlsPolicyService.delete(orgId, createdPolicyId))
    DbTestUtils.cleanUpTestDb()
  }

  test("test get table relationship") {

    val relationship: RelationshipInfo = Await.result(relationshipService.get(orgId, dashboardId))
    assert(relationship.relationships.nonEmpty)
  }

  test("test query from a single table") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("id", Select(TableField(dbName, tblCustomers, "id", "UInt32"))),
          TableColumn("name", Select(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("address", Select(TableField(dbName, tblCustomers, "address", "String"))),
          TableColumn("dob", Select(TableField(dbName, tblCustomers, "dob", "Datetime")))
        ),
        sorts = Array(
          OrderBy(function = Select(TableField(dbName, tblCustomers, "id", "UInt32")), order = Order.DESC)
        )
      )
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total == 4)
    assert(queryResult.records.size() == 4)
  }

  test("test query pivot table with group by") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "address", "String"))),
          TableColumn("address", CountAll())
        )
      )
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total == 3)
    assert(queryResult.records.size() == 3)
  }

  test("test query from a single flatten table") {
    val queryRequest: ChartRequest = ChartRequest(
      FlattenPivotTableSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String")))
        ),
        rows = Array(
          TableColumn("id", GroupBy(TableField(dbName, tblCustomers, "id", "UInt32")))
        ),
        values = Array(
          TableColumn("total id", Sum(TableField(dbName, tblCustomers, "id", "UInt32")))
        ),
        sorts = Array(
          OrderBy(function = GroupBy(TableField(dbName, tblCustomers, "id", "UInt32")), order = Order.DESC)
        )
      )
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]

    assertResult(queryResult.headers.size())(4)
    assertResult(queryResult.total)(4)
  }

  test("test query with filter request") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblOrder, "customer_id", "String"))),
          TableColumn("count order id", Count(TableField(dbName, tblOrder, "id", "UInt32")))
        )
      )
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total == 3)
  }

  test("test query with table relationship") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("count order id", Count(TableField(dbName, tblOrder, "id", "UInt32")))
        )
      ),
      dashboardId = Some(dashboardId),
      request = mockRelationshipRequest
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total == 2)
  }

  test("test query query filter request with relationship") {
    val queryRequest: ChartRequest = ChartRequest(
      querySetting = TableChartSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("count order id", Count(TableField(dbName, tblOrder, "id", "UInt32")))
        )
      ),
      filterRequests = Array(
        FilterRequest(condition = Equal(TableField(dbName, tblProducts, "name", "String"), "Iphone"))
      ),
      dashboardId = Some(dashboardId),
      request = mockRelationshipRequest
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total > 0)
  }

  test("test query query with 2 layer of relationship") {
    val queryRequest: ChartRequest = ChartRequest(
      querySetting = TableChartSetting(
        columns = Array(
          TableColumn("customer name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("product name", GroupBy(TableField(dbName, tblProducts, "name", "String")))
        )
      ),
      dashboardId = Some(dashboardId),
      request = mockRlsRequest
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total > 0)
  }

  test("test query query filter request without relationship") {
    val queryRequest: ChartRequest = ChartRequest(
      querySetting = TableChartSetting(
        columns = Array(
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("count order id", Count(TableField(dbName, tblOrder, "id", "UInt32")))
        )
      ),
      filterRequests = Array(
        FilterRequest(condition = Equal(TableField(dbName, tblSales, "Region", "String"), "Asia"))
      ),
      dashboardId = Some(dashboardId),
      request = mockRelationshipRequest
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total > 0)
  }

  test("test query from sql view") {
    val sqlView = SqlView("sql_view", SqlQuery(s"select * from $dbName.$tblCustomers"))
    val queryRequest: ChartRequest = ChartRequest(
      PieChartSetting(
        legend = TableColumn("name", GroupBy(ViewField(sqlView.aliasName, "name", "String"))),
        value = TableColumn("count_all", CountAll(Some("count_all"))),
        sqlViews = Array(sqlView)
      )
    )
    val queryResult: SeriesTwoResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[SeriesTwoResponse]
    assert(queryResult.series.nonEmpty)
  }

  test("test query with measure field") {
    val expressionRevenue = ExpressionField(
      expression = "sum(Total_Revenue)/23000",
      dbName = DbTestUtils.dbName,
      tblName = DbTestUtils.tblSales,
      fieldName = "Total_Revenue_Usd",
      fieldType = "Double"
    )

    val queryRequest = ChartRequest(
      querySetting = NumberChartSetting(
        value = TableColumn(
          name = "Select from expression",
          function = SelectExpression(field = expressionRevenue)
        )
      )
    )

    val queryResult: SeriesOneResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[SeriesOneResponse]
    assert(queryResult.series.nonEmpty)
  }

  test("test query with expression field") {
    val expressionRevenue = ExpressionField(
      expression = "Total_Revenue/23000",
      dbName = DbTestUtils.dbName,
      tblName = DbTestUtils.tblSales,
      fieldName = "Total_Revenue_Usd",
      fieldType = "Double"
    )

    val expressionCost = ExpressionField(
      expression = "Total_Cost/23000",
      dbName = DbTestUtils.dbName,
      tblName = DbTestUtils.tblSales,
      fieldName = "Total_Cost_Usd",
      fieldType = "Double"
    )

    val queryRequest = ChartRequest(
      querySetting = TableChartSetting(
        columns = Array(
          TableColumn(
            name = "Select from expression",
            function = SelectExpression(field = expressionRevenue)
          ),
          TableColumn(
            name = "Select from expression",
            function = SelectExpression(field = expressionCost)
          )
        ),
        filters = Array(
          LessThan(expressionRevenue, "3000"),
          LessThan(expressionCost, "300")
        )
      )
    )

    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total > 0)
  }

  test("test query with calculated field") {
    val expressionRevenue = CalculatedField(
      expression = "Total_Revenue/23000",
      dbName = DbTestUtils.dbName,
      tblName = DbTestUtils.tblSales,
      fieldName = "Total_Revenue_Usd",
      fieldType = "Double"
    )

    val expressionCost = CalculatedField(
      expression = "Total_Cost/23000",
      dbName = DbTestUtils.dbName,
      tblName = DbTestUtils.tblSales,
      fieldName = "Total_Cost_Usd",
      fieldType = "Double"
    )

    val queryRequest = ChartRequest(
      querySetting = TableChartSetting(
        columns = Array(
          TableColumn(
            name = "Select from expression",
            function = Select(field = expressionRevenue)
          ),
          TableColumn(
            name = "Select from expression",
            function = Select(field = expressionCost)
          )
        ),
        filters = Array(
          LessThan(expressionRevenue, "3000"),
          LessThan(expressionCost, "300")
        )
      )
    )

    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total > 0)
  }

  test("test query object query with rls policy") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("id", Select(TableField(dbName, tblCustomers, "id", "UInt32"))),
          TableColumn("name", Select(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("address", Select(TableField(dbName, tblCustomers, "address", "String"))),
          TableColumn("dob", Select(TableField(dbName, tblCustomers, "dob", "Datetime")))
        )
      ),
      request = mockRlsRequest
    )
    val queryResult: JsonTableResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total == 2)
  }

  test("test query sql view with rls policy") {
    val sqlView = SqlView("sql_view", SqlQuery(s"select * from $dbName.$tblCustomers"))
    val queryRequest: ChartRequest = ChartRequest(
      PieChartSetting(
        legend = TableColumn("name", GroupBy(ViewField(sqlView.aliasName, "name", "String"))),
        value = TableColumn("count_all", CountAll(Some("count_all"))),
        sqlViews = Array(sqlView)
      ),
      request = mockRlsRequest
    )
    val queryResult: SeriesTwoResponse = Await.result(queryService.query(queryRequest)).asInstanceOf[SeriesTwoResponse]
    assert(queryResult.series.length == 1)
  }

  test("test query histogram data") {
    val histogramChartSetting = ChartRequest(
      querySetting = HistogramChartSetting(
        value = TableColumn("count order id", Count(TableField(dbName, tblOrder, "id", "UInt32")))
      )
    )

    val queryResult: SeriesOneResponse =
      Await.result(queryService.query(histogramChartSetting)).asInstanceOf[SeriesOneResponse]
    assert(queryResult.series.nonEmpty)

  }

  test("test query slicer data") {
    val histogramChartSetting = ChartRequest(
      querySetting = GroupTableChartSetting(
        columns = Array(
          TableColumn("Order id", Min(TableField(dbName, tblOrder, "id", "UInt32"))),
          TableColumn("Order id", Max(TableField(dbName, tblOrder, "id", "UInt32")))
        )
      )
    )

    val queryResult =
      Await.result(queryService.query(histogramChartSetting)).asInstanceOf[JsonTableResponse]
    assert(queryResult.total != 0)
    println(queryResult.headers)
    println(queryResult.records)
  }

  test("export csv file") {
    val queryRequest: ChartRequest = ChartRequest(
      TableChartSetting(
        columns = Array(
          TableColumn("id", Select(TableField(dbName, tblCustomers, "id", "UInt32"))),
          TableColumn("name", Select(TableField(dbName, tblCustomers, "name", "String"))),
          TableColumn("address", Select(TableField(dbName, tblCustomers, "address", "String"))),
          TableColumn("dob", Select(TableField(dbName, tblCustomers, "dob", "Datetime")))
        ),
        sorts = Array(
          OrderBy(function = Select(TableField(dbName, tblCustomers, "id", "UInt32")), order = Order.DESC)
        )
      )
    )
    val result = await(queryService.exportAsCsv(queryRequest))
    println(result)
  }

  test("export csv file pivot table") {
    val queryRequest: ChartRequest = ChartRequest(
      PivotTableSetting(
        columns = Array(
          TableColumn("id", GroupBy(TableField(dbName, tblCustomers, "id", "UInt32"))),
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String")))
        ),
        rows = Array(
          TableColumn("id", GroupBy(TableField(dbName, tblCustomers, "id", "UInt32"))),
          TableColumn("name", GroupBy(TableField(dbName, tblCustomers, "name", "String")))
        ),
        values = Array(
          TableColumn("id", CountAll())
        ),
        sorts = Array(
          OrderBy(function = Select(TableField(dbName, tblCustomers, "id", "UInt32")), order = Order.DESC)
        )
      )
    )
    val result = await(queryService.exportAsCsv(queryRequest))
    println(JsonParser.toJson(result))
  }

}
