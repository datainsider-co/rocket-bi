package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.{AttributeBasedOperator, RlsPolicy, UserAttribute}
import co.datainsider.bi.domain.chart.{SeriesChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{Equal, GroupBy, Sum, TableField}
import co.datainsider.bi.domain.request.{ChartRequest, QueryViewAsRequest}
import co.datainsider.bi.domain.response.{SeriesOneResponse, SqlQueryResponse}
import co.datainsider.bi.service.RlsPolicyService
import co.datainsider.bi.util.{Serializer, ZConfig}
import co.datainsider.query.DbTestUtils
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import com.twitter.util.Await
import datainsider.client.domain.user.UserProfile
import org.scalatest.BeforeAndAfterAll

class QueryControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new TestServer)

  val dbName: String = ZConfig.getString("fake_data.database.name")
  val tblCustomers: String = ZConfig.getString("fake_data.table.customers.name")
  val tblOrders: String = ZConfig.getString("fake_data.table.orders.name")
  val tblProducts: String = ZConfig.getString("fake_data.table.products.name")

  override def beforeAll(): Unit = {
    super.beforeAll()
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertFakeData()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    DbTestUtils.cleanUpTestDb()
  }

  test("test query chart data") {
    val queryRequest = ChartRequest(
      querySetting = SeriesChartSetting(
        xAxis = TableColumn(
          name = "country",
          function = GroupBy(TableField(dbName, tblProducts, "country", "String"))
        ),
        yAxis = Array(
          TableColumn(
            name = "country",
            function = Sum(TableField(dbName, tblProducts, "price", "UInt64"))
          )
        )
      )
    )

    val r = server.httpPost(
      path = "/chart/query",
      postBody = Serializer.toJson(queryRequest),
      andExpect = Status.Ok
    )
    val response: SeriesOneResponse = Serializer.fromJson[SeriesOneResponse](r.getContentString())
    assert(response.series.nonEmpty)
    assert(response.xAxis.isDefined)
    assert(response.xAxis.get.length == 3)
  }

  test("test query data from sql request") {
    val defaultApiKey = "c2c09332-14a1-4eb1-8964-2d85b2a561c8"
    val r = server.httpPost(
      path = "/query/sql",
      postBody = s"""
          |{
          |	"api_key": "$defaultApiKey",
          |	"sql": "select * from $dbName.$tblCustomers limit 10"
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
    val response: SqlQueryResponse = Serializer.fromJson[SqlQueryResponse](r.getContentString())
    assert(response.headers.length == 4)
    assert(response.records.length == 4)
  }

  test("test query with ViewAsRequest") {
    val request = QueryViewAsRequest(
      queryRequest = ChartRequest(
        querySetting = SeriesChartSetting(
          xAxis = TableColumn(
            name = "country",
            function = GroupBy(TableField(dbName, tblProducts, "name", "String"))
          ),
          yAxis = Array(
            TableColumn(
              name = "country",
              function = Sum(TableField(dbName, tblProducts, "price", "UInt64"))
            )
          )
        )
      ),
      userProfile = Some(
        UserProfile(
          username = "some_user",
          fullName = Some("some user"),
          lastName = Some("some"),
          firstName = Some("user"),
          email = Some("some_user@abc.com"),
          mobilePhone = None,
          gender = None,
          dob = None,
          avatar = None,
          alreadyConfirmed = true,
          properties = Some(Map("department" -> "IT")),
          updatedTime = None,
          createdTime = None
        )
      )
    )

    val r = server.httpPost(
      path = "/chart/view_as",
      postBody = Serializer.toJson(request),
      andExpect = Status.Ok
    )
    val response: SeriesOneResponse = Serializer.fromJson[SeriesOneResponse](r.getContentString())
    assert(response.series.nonEmpty)
  }
}
