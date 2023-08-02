package co.datainsider.bi.repository

import co.datainsider.bi.domain.query.{Equal, In, TableField}
import co.datainsider.bi.domain.{AttributeBasedOperator, RlsPolicy, UserAttribute}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike

class RlsPolicyRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()

  private val rlsPolicyRepository = injector.instance[RlsPolicyRepository]

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  private val orgId = 0L
  private val newPolicy = RlsPolicy(
    orgId = orgId,
    userIds = Seq("tvc12", "root", "nkt165"),
    userAttribute = Some(UserAttribute("department", Seq("IT"), AttributeBasedOperator.Equal)),
    dbName = "sales",
    tblName = "orders",
    conditions = Array(Equal(TableField("sales", "orders", "Region", "String"), "Asia"))
  )

  var policyId = 0L
  test("test create rls policy") {
    val createdId = rlsPolicyRepository.create(orgId, newPolicy).syncGet

    policyId = createdId

    assert(policyId != 0)
  }

  test("test multi create policies") {
    val newPolicies = Seq(newPolicy.copy(tblName = "customers"), newPolicy.copy(tblName = "products"))
    val multiCreateOk = rlsPolicyRepository.multiCreate(orgId, newPolicies).syncGet

    assert(multiCreateOk)
  }

  test("test list table policies") {
    val policies = rlsPolicyRepository.list(orgId, None, None).syncGet()

    assert(policies.length == 3)
    policies.foreach(println)
  }

  test("test update table policy") {
    val updateOk = rlsPolicyRepository
      .update(
        orgId,
        newPolicy
          .copy(
            policyId = policyId,
            conditions = Array(In(TableField("sales", "orders", "Item_Type", "String"), Set("food", "Drink"))),
            userIds = Seq.empty
          )
      )
      .syncGet

    assert(updateOk)
  }

  test("test get table policy") {
    val policy = rlsPolicyRepository.get(orgId, policyId).syncGet()

    assert(policy.isDefined)
    assert(policy.get.userIds.isEmpty)
//    assert(policy.get.conditions.head.isInstanceOf[In])
    println(policy)
  }

  test("test multi update policies") {
    val policies = rlsPolicyRepository.list(orgId, None, None).syncGet()
    val newPolicies = policies.map(policy => policy.copy(tblName = "new_" + policy.tblName))

    val multiUpdateOk = rlsPolicyRepository.multiUpdate(orgId, newPolicies).syncGet
    assert(multiUpdateOk)

    val updatedPolicies = rlsPolicyRepository.list(orgId, None, None).syncGet()
    assert(updatedPolicies.nonEmpty)
    updatedPolicies.foreach(policy => assert(policy.tblName.contains("new_")))
  }

  test("test delete policy") {
    val deleteOk = rlsPolicyRepository.delete(orgId, policyId).syncGet
    assert(deleteOk)
  }

  test("test multi delete policy") {
    val policies = rlsPolicyRepository.list(orgId, None, None).syncGet()
    val multiDeleteOk = rlsPolicyRepository.multiDelete(orgId, policies.map(_.policyId)).syncGet()

    assert(multiDeleteOk)
  }
}
