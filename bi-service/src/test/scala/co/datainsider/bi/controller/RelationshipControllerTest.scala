package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.{FieldPair, Relationship}
import co.datainsider.bi.domain.query.{TableField, TableView}
import co.datainsider.bi.domain.request.CreateRelationshipRequest
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.util.JsonParser

class RelationshipControllerTest extends FeatureTest {
  override val server = new EmbeddedHttpServer(new TestServer)

  val dashboardId: Long = 1

  test("test create global relationship") {
    val request = CreateRelationshipRequest(
      views = Seq(
        TableView("sales", "orders"),
        TableView("sales", "customers"),
        TableView("sales", "products")
      ),
      relationships = Seq(
        Relationship(
          firstView = TableView("sales", "orders"),
          secondView = TableView("sales", "customers"),
          fieldPairs = Seq(
            FieldPair(TableField("sales", "orders", "oid", "string"), TableField("sales", "customers", "cid", "string"))
          )
        ),
        Relationship(
          firstView = TableView("sales", "orders"),
          secondView = TableView("sales", "products"),
          fieldPairs = Seq(
            FieldPair(TableField("sales", "orders", "oid", "string"), TableField("sales", "products", "pid", "string"))
          )
        )
      ),
      extraData = Map(
        "positions" -> "some position data"
      )
    )

    val r = server.httpPost(
      path = "/relationships/global",
      postBody = JsonParser.toJson(request),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
  }

  test("test get global relationship") {
    val r = server.httpGet(
      path = "/relationships/global",
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
  }

  test("test delete global relationship") {
    val r = server.httpDelete(
      path = "/relationships/global",
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
  }

  test("test create dashboard relationship") {
    val request = CreateRelationshipRequest(
      views = Seq(
        TableView("sales", "orders"),
        TableView("sales", "customers"),
        TableView("sales", "products")
      ),
      relationships = Seq(
        Relationship(
          firstView = TableView("sales", "orders"),
          secondView = TableView("sales", "customers"),
          fieldPairs = Seq(
            FieldPair(TableField("sales", "orders", "oid", "string"), TableField("sales", "customers", "cid", "string"))
          )
        ),
        Relationship(
          firstView = TableView("sales", "orders"),
          secondView = TableView("sales", "products"),
          fieldPairs = Seq(
            FieldPair(TableField("sales", "orders", "oid", "string"), TableField("sales", "products", "pid", "string"))
          )
        )
      ),
      extraData = Map(
        "positions" -> Map("first_table" -> 2, "second_table" -> 3)
      )
    )

    val r = server.httpPost(
      path = s"/relationships/$dashboardId",
      postBody = JsonParser.toJson(request),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
  }

  test("test get dashboard relationship") {
    val r = server.httpGet(
      path = s"/relationships/$dashboardId"
    )

    assert(r.contentString.nonEmpty)
  }

  test("test delete dashboard relationship") {
    val r = server.httpDelete(
      path = s"/relationships/$dashboardId",
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
  }

}
