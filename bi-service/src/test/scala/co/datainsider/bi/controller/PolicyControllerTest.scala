package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.query.{Equal, In, TableField}
import co.datainsider.bi.domain.request.{ListPolicyRequest, SavePolicyRequest}
import co.datainsider.bi.domain.{RlsPolicy, UserAttribute, AttributeBasedOperator}
import co.datainsider.bi.util.Serializer
import co.datainsider.share.domain.response.PageResult
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.util.JsonParser

class PolicyControllerTest extends FeatureTest {

  override val server = new EmbeddedHttpServer(new TestServer)

  private var policyId = 0L
  private val orgId = 0L

  val newPolicy = RlsPolicy(
    orgId = orgId,
    userIds = Seq("tvc12", "root", "nkt165"),
    userAttribute = Some(UserAttribute("department", Seq("IT"), AttributeBasedOperator.Equal)),
    dbName = "sales",
    tblName = "orders",
    conditions = Array(Equal(TableField("sales", "orders", "Region", "String"), "Asia"))
  )

  test("test controller create rls policy") {
    val saveRequest: SavePolicyRequest = SavePolicyRequest(
      dbName = "sales",
      tblName = "orders",
      policies = Array(
        newPolicy.copy(userAttribute =
          Some(UserAttribute(key = "department", values = Seq.empty, operator = AttributeBasedOperator.IsNull))
        ),
        newPolicy.copy(userAttribute =
          Some(UserAttribute(key = "department", values = Seq("IT"), operator = AttributeBasedOperator.Equal))
        )
      )
    )

    val r = server.httpPut(
      path = "/policies",
      putBody = JsonParser.toJson(saveRequest),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
    val policies = Serializer.fromJson[PageResult[RlsPolicy]](r.contentString)
    assert(policies.total == 2)
    assert(policies.data.head.policyId != 0)
    policyId = policies.data.head.policyId
  }

  test("test controller list policies") {
    val listRequest = ListPolicyRequest(
      dbName = Some("sales"),
      tblName = Some("orders")
    )

    val r = server.httpPost(
      path = "/policies/list",
      postBody = JsonParser.toJson(listRequest),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
    val policies = Serializer.fromJson[PageResult[RlsPolicy]](r.contentString)
    assert(policies.data.nonEmpty)
    assert(policies.total != 0)

    assert(policies.data.head.userIds.nonEmpty)
    assert(policies.data.head.userAttribute.isDefined)
    assert(policies.data.head.conditions.nonEmpty)
  }

  test("test add and update rls policy") {
    val saveRequest: SavePolicyRequest = SavePolicyRequest(
      dbName = "sales",
      tblName = "orders",
      policies = Array(
        newPolicy.copy(
          policyId = policyId,
          userAttribute =
            Some(UserAttribute(key = "region", values = Seq.empty, operator = AttributeBasedOperator.IsNull))
        ),
        newPolicy.copy(userAttribute =
          Some(UserAttribute(key = "department", values = Seq("Marketing"), operator = AttributeBasedOperator.Equal))
        )
      )
    )

    val r = server.httpPut(
      path = "/policies",
      putBody = JsonParser.toJson(saveRequest),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
    val policies = Serializer.fromJson[PageResult[RlsPolicy]](r.contentString)
    assert(policies.total == 2)
    assert(policies.data.exists(p => p.policyId == policyId))
    assert(policies.data.find(p => p.policyId == policyId).get.userAttribute.isDefined)
    assert(policies.data.find(p => p.policyId == policyId).get.userAttribute.get.key == "region")
  }

  test("test controller delete rls policy") {
    val saveRequest: SavePolicyRequest = SavePolicyRequest(
      dbName = "sales",
      tblName = "orders",
      policies = Array.empty
    )

    val r = server.httpPut(
      path = "/policies",
      putBody = JsonParser.toJson(saveRequest),
      andExpect = Status.Ok
    )

    assert(r.contentString.nonEmpty)
    val policies = Serializer.fromJson[PageResult[RlsPolicy]](r.contentString)
    assert(policies.total == 0)
    assert(policies.data.isEmpty)
  }

}
