package co.datainsider.bi.repository

import co.datainsider.bi.domain.query.{TableField, TableView}
import co.datainsider.bi.domain.{FieldPair, Relationship, RelationshipInfo}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike

class RelationshipRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()

  val relationshipRepository = injector.instance[RelationshipRepository]

  val relationshipKey = "global"

  test("test create or update relationship") {
    val relationshipInfo = RelationshipInfo(
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
      )
    )

    val createOk = relationshipRepository.createOrUpdate(relationshipKey, relationshipInfo).syncGet()
    assert(createOk)
  }

  test("test get relationship") {
    val relationshipInfo = relationshipRepository.get(relationshipKey).syncGet()
    assert(relationshipInfo.isDefined)
    println(relationshipInfo.get)
  }

  test("test delete relationship") {
    val deleteOk = relationshipRepository.delete(relationshipKey).syncGet()
    assert(deleteOk)
  }
}
