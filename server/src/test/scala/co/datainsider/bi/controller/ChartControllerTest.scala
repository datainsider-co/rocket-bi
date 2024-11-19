/*
package co.datainsider.bi.controller

import co.datainsider.bi.Server
import co.datainsider.bi.domain.{TableColumn, _}
import co.datainsider.bi.domain.request.{CompareRequest, FilterRequest, QueryRequest, ZoomRequest}
import co.datainsider.bi.domain.response.TableResponse
import co.datainsider.bi.util.{Serializer, ZConfig}
import co.datainsider.query.DbTestUtils
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class ChartControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new Server)

  val db: String = ZConfig.getString("fake_data.database.name")
  val tblCustomers: String = ZConfig.getString("fake_data.table.customers.name")
  val tblOrders: String = ZConfig.getString("fake_data.table.orders.name")
  val tblProducts: String = ZConfig.getString("fake_data.table.products.name")
  val tblGdp: String = ZConfig.getString("fake_data.table.gdp.name")

  override def beforeAll(): Unit = {
    DbTestUtils.setUpDbForTesting()
    DbTestUtils.insertFakeData()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
  }

  test("new builder filter request") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32"))))
          ),
          Array(FilterRequest(1, Equal(Field(db, tblProducts, "name", "string"), "Iphone")))
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"price\",\"data\":[3089]}],\"x_axis\":[\"Iphone\"]}"
    )
  }

  test("new builder filter request with having condition") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32"))))
          ),
          Array(FilterRequest(1, AggregateGreaterThan(Sum(Field(db, tblProducts, "price", "UInt32")), "2000")))
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"price\",\"data\":[3089]}],\"x_axis\":[\"Iphone\"]}"
    )
  }

  test("new builder pie like chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          FunnelChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "id", "UInt32"))),
            TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"name\",\"data\":[[\"3\",1999],[\"10\",1050],[\"2\",999],[\"9\",950],[\"8\",160],[\"11\",90],[\"4\",75],[\"7\",55],[\"6\",40],[\"5\",35],[\"1\",25]]}]}"
    )
  }

  test("new builder series chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))),
            Some(TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"Co Ba Ha Noi\",\"data\":[200,null,null,null]},{\"name\":\"Co Ba Sai Gon\",\"data\":[165,25,null,null]},{\"name\":\"Apple\",\"data\":[null,null,999,1999]},{\"name\":\"China\",\"data\":[null,null,1140,null]},{\"name\":\"CellphoneS\",\"data\":[null,null,950,null]}],\"x_axis\":[\"Banh Mi Sai Gon\",\"Hu Tieu My Tho\",\"Iphone\",\"MacBook13\"]}"
    )
  }

  test("new builder series chart, multiple yAxis and 1 legend") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(
              TableColumn("sum price", Sum(Field(db, tblProducts, "price", "UInt32"))),
              TableColumn("avg id", Avg(Field(db, tblProducts, "id", "UInt32")))
            ),
            Some(TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"Co Ba Ha Noi - sum price\",\"data\":[200,null,null,null]},{\"name\":\"Co Ba Ha Noi - avg id\",\"data\":[7,null,null,null]},{\"name\":\"Co Ba Sai Gon - sum price\",\"data\":[165,25,null,null]},{\"name\":\"Co Ba Sai Gon - avg id\",\"data\":[5,1,null,null]},{\"name\":\"Apple - sum price\",\"data\":[null,null,999,1999]},{\"name\":\"Apple - avg id\",\"data\":[null,null,2,3]},{\"name\":\"China - sum price\",\"data\":[null,null,1140,null]},{\"name\":\"China - avg id\",\"data\":[null,null,11,null]},{\"name\":\"CellphoneS - sum price\",\"data\":[null,null,950,null]},{\"name\":\"CellphoneS - avg id\",\"data\":[null,null,9,null]}],\"x_axis\":[\"Banh Mi Sai Gon\",\"Hu Tieu My Tho\",\"Iphone\",\"MacBook13\"]}"
    )
  }

  test("new builder series chart no legend") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32"))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"price\",\"data\":[3089,1999,365,25]}],\"x_axis\":[\"Iphone\",\"MacBook13\",\"Banh Mi Sai Gon\",\"Hu Tieu My Tho\"]}"
    )
  }

  test("new builder series chart with no legend and multiple yAxis") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            Array(
              TableColumn("sum price", Sum(Field(db, tblProducts, "price", "UInt32"))),
              TableColumn("avg id", Avg(Field(db, tblProducts, "id", "UInt32")))
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum price\",\"data\":[3089,1999,365,25]},{\"name\":\"avg id\",\"data\":[8,3,6,1]}],\"x_axis\":[\"Iphone\",\"MacBook13\",\"Banh Mi Sai Gon\",\"Hu Tieu My Tho\"]}"
    )
  }

  test("new builder scatter chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          ScatterChartSetting(
            TableColumn("uid", Select(Field(db, tblOrders, "customer_id", "UInt32"))),
            TableColumn("pid", Select(Field(db, tblOrders, "product_id", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"\",\"data\":[[1,1],[2,2],[4,2],[1,2]]}]}"
    )
  }

  test("new builder scatter chart with legend") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          ScatterChartSetting(
            TableColumn("uid", GroupBy(Field(db, tblOrders, "customer_id", "UInt32"))),
            TableColumn("pid", GroupBy(Field(db, tblOrders, "product_id", "UInt32"))),
            Some(TableColumn("id", GroupBy(Field(db, tblOrders, "created_date", "datetime"), Some(ToDayOfWeek()))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"Monday\",\"data\":[[2,2]]},{\"name\":\"Wednesday\",\"data\":[[4,2]]},{\"name\":\"Sunday\",\"data\":[[1,2],[1,1]]}]}"
    )
  }

  test("new builder bubble chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          BubbleChartSetting(
            TableColumn("uid", Select(Field(db, tblOrders, "customer_id", "UInt32"))),
            TableColumn("pid", Select(Field(db, tblOrders, "product_id", "UInt32"))),
            TableColumn("id", Select(Field(db, tblOrders, "id", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"\",\"data\":[[1,1,1],[2,2,2],[4,2,4],[1,2,3]]}]}"
    )
  }

  test("new builder bubble chart with legend") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          BubbleChartSetting(
            TableColumn("uid", GroupBy(Field(db, tblOrders, "customer_id", "UInt32"))),
            TableColumn("pid", GroupBy(Field(db, tblOrders, "product_id", "UInt32"))),
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32"))),
            Some(TableColumn("id", GroupBy(Field(db, tblOrders, "created_date", "datetime"), Some(ToDayOfWeek()))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"Monday\",\"data\":[[2,2,2]]},{\"name\":\"Wednesday\",\"data\":[[4,2,4]]},{\"name\":\"Sunday\",\"data\":[[1,2,3],[1,1,1]]}]}"
    )
  }

  test("new builder heat map chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          HeatMapChartSetting(
            TableColumn("uid", GroupBy(Field(db, tblOrders, "customer_id", "UInt32"))),
            TableColumn("pid", GroupBy(Field(db, tblOrders, "product_id", "UInt32"))),
            TableColumn("sum id", Sum(Field(db, tblOrders, "id", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"sum id\",\"data\":[[0,0,1],[1,0,null],[2,0,null],[0,1,3],[1,1,2],[2,1,4]]}],\"x_axis\":[\"1\",\"2\",\"4\"],\"y_axis\":[\"1\",\"2\"]}"
    )
  }

  test("new builder table chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TableChartSetting(
            Array(
              TableColumn("uid", Select(Field(db, tblOrders, "customer_id", "UInt32"))),
              TableColumn("pid", Select(Field(db, tblOrders, "product_id", "UInt32"))),
              TableColumn("id", Select(Field(db, tblOrders, "id", "UInt32")))
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"json_table_response\",\"headers\":[{\"key\":\"0\",\"label\":\"uid\",\"is_group_by\":false,\"is_text_left\":false},{\"key\":\"1\",\"label\":\"pid\",\"is_group_by\":false,\"is_text_left\":false},{\"key\":\"2\",\"label\":\"id\",\"is_group_by\":false,\"is_text_left\":false}],\"records\":[{\"0\":\"1\",\"1\":\"1\",\"2\":\"1\"},{\"0\":\"2\",\"1\":\"2\",\"2\":\"2\"},{\"0\":\"4\",\"1\":\"2\",\"2\":\"4\"},{\"0\":\"1\",\"1\":\"2\",\"2\":\"3\"}],\"total\":4,\"excel_table_setting\":{\"columns\":[]}}"
    )
  }

  test("new builder number chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          NumberChartSetting(
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"10\"]}]}")
  }

  test("new builder drilldown chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          DrilldownChartSetting(
            Array(
              TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))),
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
              TableColumn("id", GroupBy(Field(db, tblProducts, "id", "UInt32")))
            ),
            TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"drilldown_response\",\"name\":\"seller\",\"series\":[{\"name\":\"China\",\"y\":1140,\"drilldown\":\"China\"},{\"name\":\"Apple\",\"y\":2998,\"drilldown\":\"Apple\"},{\"name\":\"CellphoneS\",\"y\":950,\"drilldown\":\"CellphoneS\"},{\"name\":\"Co Ba Ha Noi\",\"y\":200,\"drilldown\":\"Co Ba Ha Noi\"},{\"name\":\"Co Ba Sai Gon\",\"y\":190,\"drilldown\":\"Co Ba Sai Gon\"}],\"drilldown\":[{\"name\":\"Co Ba Sai Gon.Hu Tieu My Tho\",\"id\":\"Co Ba Sai Gon.Hu Tieu My Tho\",\"data\":[{\"name\":\"1\",\"y\":25,\"drilldown\":\"Co Ba Sai Gon.Hu Tieu My Tho.1\"}]},{\"name\":\"CellphoneS\",\"id\":\"CellphoneS\",\"data\":[{\"name\":\"Iphone\",\"y\":950,\"drilldown\":\"CellphoneS.Iphone\"}]},{\"name\":\"Apple.Iphone\",\"id\":\"Apple.Iphone\",\"data\":[{\"name\":\"2\",\"y\":999,\"drilldown\":\"Apple.Iphone.2\"}]},{\"name\":\"China.Iphone\",\"id\":\"China.Iphone\",\"data\":[{\"name\":\"10\",\"y\":1050,\"drilldown\":\"China.Iphone.10\"},{\"name\":\"11\",\"y\":90,\"drilldown\":\"China.Iphone.11\"}]},{\"name\":\"Co Ba Sai Gon\",\"id\":\"Co Ba Sai Gon\",\"data\":[{\"name\":\"Banh Mi Sai Gon\",\"y\":165,\"drilldown\":\"Co Ba Sai Gon.Banh Mi Sai Gon\"},{\"name\":\"Hu Tieu My Tho\",\"y\":25,\"drilldown\":\"Co Ba Sai Gon.Hu Tieu My Tho\"}]},{\"name\":\"China\",\"id\":\"China\",\"data\":[{\"name\":\"Iphone\",\"y\":1140,\"drilldown\":\"China.Iphone\"}]},{\"name\":\"Co Ba Ha Noi.Banh Mi Sai Gon\",\"id\":\"Co Ba Ha Noi.Banh Mi Sai Gon\",\"data\":[{\"name\":\"8\",\"y\":160,\"drilldown\":\"Co Ba Ha Noi.Banh Mi Sai Gon.8\"},{\"name\":\"6\",\"y\":40,\"drilldown\":\"Co Ba Ha Noi.Banh Mi Sai Gon.6\"}]},{\"name\":\"Apple.MacBook13\",\"id\":\"Apple.MacBook13\",\"data\":[{\"name\":\"3\",\"y\":1999,\"drilldown\":\"Apple.MacBook13.3\"}]},{\"name\":\"Co Ba Sai Gon.Banh Mi Sai Gon\",\"id\":\"Co Ba Sai Gon.Banh Mi Sai Gon\",\"data\":[{\"name\":\"7\",\"y\":55,\"drilldown\":\"Co Ba Sai Gon.Banh Mi Sai Gon.7\"},{\"name\":\"5\",\"y\":35,\"drilldown\":\"Co Ba Sai Gon.Banh Mi Sai Gon.5\"},{\"name\":\"4\",\"y\":75,\"drilldown\":\"Co Ba Sai Gon.Banh Mi Sai Gon.4\"}]},{\"name\":\"CellphoneS.Iphone\",\"id\":\"CellphoneS.Iphone\",\"data\":[{\"name\":\"9\",\"y\":950,\"drilldown\":\"CellphoneS.Iphone.9\"}]},{\"name\":\"Co Ba Ha Noi\",\"id\":\"Co Ba Ha Noi\",\"data\":[{\"name\":\"Banh Mi Sai Gon\",\"y\":200,\"drilldown\":\"Co Ba Ha Noi.Banh Mi Sai Gon\"}]},{\"name\":\"Apple\",\"id\":\"Apple\",\"data\":[{\"name\":\"Iphone\",\"y\":999,\"drilldown\":\"Apple.Iphone\"},{\"name\":\"MacBook13\",\"y\":1999,\"drilldown\":\"Apple.MacBook13\"}]}]}"
    )
  }

  test("new builder gauge chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          GaugeChartSetting(
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[10]}]}")
  }

  test("new builder tree map chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TreeMapChartSetting(
            Array(
              TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))),
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string")))
            ),
            TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"tree_map_response\",\"name\":\"seller\",\"data\":[{\"id\":\"China\",\"name\":\"China\",\"value\":1140,\"color_value\":1140},{\"id\":\"Apple\",\"name\":\"Apple\",\"value\":2998,\"color_value\":2998},{\"id\":\"CellphoneS\",\"name\":\"CellphoneS\",\"value\":950,\"color_value\":950},{\"id\":\"Co Ba Ha Noi\",\"name\":\"Co Ba Ha Noi\",\"value\":200,\"color_value\":200},{\"id\":\"Co Ba Sai Gon\",\"name\":\"Co Ba Sai Gon\",\"value\":190,\"color_value\":190},{\"id\":\"China.Iphone\",\"name\":\"Iphone\",\"value\":1140,\"color_value\":1140,\"parent\":\"China\"},{\"id\":\"Apple.MacBook13\",\"name\":\"MacBook13\",\"value\":1999,\"color_value\":1999,\"parent\":\"Apple\"},{\"id\":\"Apple.Iphone\",\"name\":\"Iphone\",\"value\":999,\"color_value\":999,\"parent\":\"Apple\"},{\"id\":\"CellphoneS.Iphone\",\"name\":\"Iphone\",\"value\":950,\"color_value\":950,\"parent\":\"CellphoneS\"},{\"id\":\"Co Ba Ha Noi.Banh Mi Sai Gon\",\"name\":\"Banh Mi Sai Gon\",\"value\":200,\"color_value\":200,\"parent\":\"Co Ba Ha Noi\"},{\"id\":\"Co Ba Sai Gon.Hu Tieu My Tho\",\"name\":\"Hu Tieu My Tho\",\"value\":25,\"color_value\":25,\"parent\":\"Co Ba Sai Gon\"},{\"id\":\"Co Ba Sai Gon.Banh Mi Sai Gon\",\"name\":\"Banh Mi Sai Gon\",\"value\":165,\"color_value\":165,\"parent\":\"Co Ba Sai Gon\"}],\"group_names\":[\"China\",\"Apple\",\"CellphoneS\",\"Co Ba Ha Noi\",\"Co Ba Sai Gon\"]}"
    )
  }

  test("new builder word cloud chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          WordCloudChartSetting(
            TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
            TableColumn("price", Avg(Field(db, tblProducts, "price", "UInt32")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"word_cloud_response\",\"name\":\"\",\"data\":[{\"name\":\"Iphone\",\"weight\":772},{\"name\":\"MacBook13\",\"weight\":1999},{\"name\":\"Banh Mi Sai Gon\",\"weight\":73},{\"name\":\"Hu Tieu My Tho\",\"weight\":25}]}"
    )
  }

  test("new query builder with limit") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TableChartSetting(
            Array(
              TableColumn("id", Select(Field(db, tblProducts, "id", "string"))),
              TableColumn("name", Select(Field(db, tblProducts, "name", "string")))
            )
          ),
          from = 1,
          size = 1
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"json_table_response\",\"headers\":[{\"key\":\"0\",\"label\":\"id\",\"is_group_by\":false,\"is_text_left\":false},{\"key\":\"1\",\"label\":\"name\",\"is_group_by\":false,\"is_text_left\":true}],\"records\":[{\"0\":\"3\",\"1\":\"MacBook13\"}],\"total\":11,\"excel_table_setting\":{\"columns\":[]}}"
    )

  }

  test("new query builder with limit (group query)") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TableChartSetting(
            Array(
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
              TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))),
              TableColumn("id", Sum(Field(db, tblProducts, "price", "string")))
            ),
            sorts = Array(
              OrderBy(Sum(Field(db, tblProducts, "price", "string")))
            )
          ),
          from = 1,
          size = 1
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    println(response)
  }

  test("new builder with order by") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TableChartSetting(
            Array(
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string"))),
              TableColumn("price", Avg(Field(db, tblProducts, "price", "UInt32")))
            ),
            sorts = Array(
              OrderBy(Sum(Field(db, tblProducts, "id", "UInt32")), Order.DESC)
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"json_table_response\",\"headers\":[{\"key\":\"0\",\"label\":\"name\",\"is_group_by\":true,\"is_text_left\":true},{\"key\":\"1\",\"label\":\"price\",\"is_group_by\":false,\"is_text_left\":false}],\"records\":[{\"0\":\"Iphone\",\"1\":\"772\"},{\"0\":\"Banh Mi Sai Gon\",\"1\":\"73\"},{\"0\":\"MacBook13\",\"1\":\"1999\"},{\"0\":\"Hu Tieu My Tho\",\"1\":\"25\"}],\"total\":4,\"excel_table_setting\":{\"columns\":[]}}"
    )
  }

  test("new builder with group table isCalcGroupTotal = false") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          TableChartSetting(
            Array(
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "string")), isCalcGroupTotal = false),
              TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))),
              TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))
            ),
            sorts = Array(
              OrderBy(Sum(Field(db, tblProducts, "price", "UInt32")), Order.ASC)
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"json_table_response\",\"headers\":[{\"key\":\"0\",\"label\":\"name\",\"is_group_by\":true,\"is_text_left\":true},{\"key\":\"1\",\"label\":\"price by name\",\"is_group_by\":false,\"is_text_left\":true},{\"key\":\"2\",\"label\":\"seller\",\"is_group_by\":true,\"is_text_left\":true},{\"key\":\"3\",\"label\":\"price\",\"is_group_by\":false,\"is_text_left\":false}],\"records\":[{\"0\":\"Hu Tieu My Tho\",\"1\":\"25\",\"2\":\"Co Ba Sai Gon\",\"3\":\"25\"},{\"0\":\"Banh Mi Sai Gon\",\"1\":\"365\",\"2\":\"Co Ba Sai Gon\",\"3\":\"165\"},{\"0\":\"Banh Mi Sai Gon\",\"1\":\"365\",\"2\":\"Co Ba Ha Noi\",\"3\":\"200\"},{\"0\":\"MacBook13\",\"1\":\"1999\",\"2\":\"Apple\",\"3\":\"1999\"},{\"0\":\"Iphone\",\"1\":\"3089\",\"2\":\"CellphoneS\",\"3\":\"950\"},{\"0\":\"Iphone\",\"1\":\"3089\",\"2\":\"Apple\",\"3\":\"999\"},{\"0\":\"Iphone\",\"1\":\"3089\",\"2\":\"China\",\"3\":\"1140\"}],\"total\":4,\"excel_table_setting\":{\"columns\":[]}}"
    )
  }

  test("new builder number chart with compare request: RawValues") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          NumberChartSetting(
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32")))
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.RawValues
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"7\"]}],\"compare_responses\":{\"RawValues\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"3\"]}]}}}"
    )
  }

  test("new builder number chart with compare request: ValuesDiff") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          NumberChartSetting(
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32")))
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.ValuesDiff
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"7\"]}],\"compare_responses\":{\"ValuesDifference\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"4\"]}]}}}"
    )
  }

  test("new builder number chart with compare request: PercentageDiff") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          NumberChartSetting(
            TableColumn("id", Sum(Field(db, tblOrders, "id", "UInt32")))
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.PercentageDiff
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"7\"]}],\"compare_responses\":{\"PercentageDifference\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"id\",\"data\":[\"133\"]}]}}}"
    )
  }

  test("new builder series chart with compare request: RawValues") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            xAxis = TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "UInt32"))),
            yAxis = Array(
              TableColumn("sum profit", Sum(Field(db, tblProducts, "price", "UInt32")))
            ),
            filters = Array(
              EqualField(
                Field(db, tblProducts, "id", "UInt32"),
                Field(db, tblOrders, "product_id", "UInt32")
              )
            )
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.RawValues
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[1998]}],\"x_axis\":[\"Apple\"],\"compare_responses\":{\"RawValues\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[999]}],\"x_axis\":[\"Apple\"]}}}"
    )
  }

  test("new builder series chart with compare request: ValuesDiff") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            xAxis = TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "UInt32"))),
            yAxis = Array(
              TableColumn("sum profit", Sum(Field(db, tblProducts, "price", "UInt32")))
            ),
            filters = Array(
              EqualField(
                Field(db, tblProducts, "id", "UInt32"),
                Field(db, tblOrders, "product_id", "UInt32")
              )
            )
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.ValuesDiff
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[1998]}],\"x_axis\":[\"Apple\"],\"compare_responses\":{\"ValuesDifference\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[999.0]}],\"x_axis\":[\"Apple\"]}}}"
    )
  }

  test("new builder series chart with compare request: PercentageDiff") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          SeriesChartSetting(
            xAxis = TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "UInt32"))),
            yAxis = Array(
              TableColumn("sum profit", Sum(Field(db, tblProducts, "price", "UInt32")))
            ),
            filters = Array(
              EqualField(
                Field(db, tblProducts, "id", "UInt32"),
                Field(db, tblOrders, "product_id", "UInt32")
              )
            )
          ),
          compareRequest = Some(
            CompareRequest(
              GreaterThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              LessThan(Field(db, tblOrders, "created_date", "datetime"), "2020-06-09 00:00:00"),
              CompareMode.PercentageDiff
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[1998]}],\"x_axis\":[\"Apple\"],\"compare_responses\":{\"PercentageDifference\":{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"sum profit\",\"data\":[100]}],\"x_axis\":[\"Apple\"]}}}"
    )
  }

  test("new builder histogram chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          HistogramChartSetting(
            value = TableColumn("price", Select(Field(db, tblProducts, "price", "UInt32"))),
            binsNumber = 3
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_one_response\",\"series\":[{\"name\":\"price\",\"data\":[7,3,1]}],\"x_axis\":[\"[25, 534]\",\"[534, 1499]\",\"[1499, 1999]\"]}"
    )
  }

  test("new builder table chart nested json response (children...)") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          GroupTableChartSetting(
            Array(
              TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "UInt32"))),
              TableColumn("name", GroupBy(Field(db, tblProducts, "name", "UInt32"))),
              TableColumn("price", Sum(Field(db, tblProducts, "price", "UInt32")))
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"json_table_response\",\"headers\":[{\"key\":0,\"label\":\"seller\",\"is_group_by\":true,\"is_text_left\":true},{\"key\":1,\"label\":\"price by seller\",\"is_group_by\":false,\"is_text_left\":true}],\"records\":[{\"0\":\"China\",\"children\":[{\"0\":\"Iphone\",\"children\":[],\"1\":\"1140\"}],\"1\":\"1140\"},{\"0\":\"Apple\",\"children\":[{\"0\":\"MacBook13\",\"children\":[],\"1\":\"1999\"},{\"0\":\"Iphone\",\"children\":[],\"1\":\"999\"}],\"1\":\"2998\"},{\"0\":\"CellphoneS\",\"children\":[{\"0\":\"Iphone\",\"children\":[],\"1\":\"950\"}],\"1\":\"950\"},{\"0\":\"Co Ba Ha Noi\",\"children\":[{\"0\":\"Banh Mi Sai Gon\",\"children\":[],\"1\":\"200\"}],\"1\":\"200\"},{\"0\":\"Co Ba Sai Gon\",\"children\":[{\"0\":\"Hu Tieu My Tho\",\"children\":[],\"1\":\"25\"},{\"0\":\"Banh Mi Sai Gon\",\"children\":[],\"1\":\"165\"}],\"1\":\"190\"}],\"total\":5,\"excel_table_setting\":{\"columns\":[]}}"
    )
  }

  test("new builder dropdown filter chart (value only)") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          DropdownFilterChartSetting(
            value = TableColumn("seller", Select(Field(db, tblProducts, "seller", "String")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"viz_table_response\",\"headers\":[\"label\",\"value\"],\"records\":[[\"Apple\",\"Apple\"],[\"Apple\",\"Apple\"],[\"CellphoneS\",\"CellphoneS\"],[\"Co Ba Ha Noi\",\"Co Ba Ha Noi\"],[\"Co Ba Ha Noi\",\"Co Ba Ha Noi\"],[\"China\",\"China\"],[\"China\",\"China\"],[\"Co Ba Sai Gon\",\"Co Ba Sai Gon\"],[\"Co Ba Sai Gon\",\"Co Ba Sai Gon\"],[\"Co Ba Sai Gon\",\"Co Ba Sai Gon\"],[\"Co Ba Sai Gon\",\"Co Ba Sai Gon\"]],\"total\":11}"
    )
  }

  test("new builder dropdown filter chart (value and label)") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          DropdownFilterChartSetting(
            value = TableColumn("id", Select(Field(db, tblProducts, "id", "String"))),
            label = Some(TableColumn("seller", Select(Field(db, tblProducts, "seller", "String"))))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"viz_table_response\",\"headers\":[\"label\",\"value\"],\"records\":[[\"Apple\",2],[\"Apple\",3],[\"CellphoneS\",9],[\"Co Ba Ha Noi\",6],[\"Co Ba Ha Noi\",8],[\"China\",10],[\"China\",11],[\"Co Ba Sai Gon\",1],[\"Co Ba Sai Gon\",4],[\"Co Ba Sai Gon\",5],[\"Co Ba Sai Gon\",7]],\"total\":11}"
    )
  }

  test("new builder map chart") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          MapChartSetting(
            location = TableColumn("country", GroupBy(Field(db, tblGdp, "country", "String"))),
            value = TableColumn("gdp", Sum(Field(db, tblGdp, "gdp", "UInt64")))
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    println(response)
  }

  test("top N element sorted") {
    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(
        QueryRequest(
          PieChartSetting(
            legend = TableColumn("seller", GroupBy(Field(db, tblProducts, "seller", "string"))),
            value = TableColumn("price", Sum(Field(db, tblProducts, "price", "uint32"))),
            sorts = Array(
              OrderBy(Sum(Field(db, tblProducts, "price", "uint32")), order = Order.DESC, numElemsShown = Some(2))
            )
          )
        )
      ),
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(
      response == "{\"class_name\":\"series_two_response\",\"series\":[{\"name\":\"seller\",\"data\":[[\"Apple\",2998],[\"China\",1140]]}]}"
    )
  }
}
*/
