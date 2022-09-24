package co.datainsider.bi.utils

import co.datainsider.bi.domain.query.{TableField, TableView}
import co.datainsider.bi.domain.{FieldPair, Relationship, RelationshipGraph}
import org.scalatest.FunSuite

import scala.collection.mutable

class RelationshipGraphTest extends FunSuite {

  // tbl1 -> tbl2 -> tbl3 -> tbl4
  //    \------- tbl5 --------^

  val db: String = "db"
  val tbl1: String = "tbl1"
  val tbl2: String = "tbl2"
  val tbl3: String = "tbl3"
  val tbl4: String = "tbl4"
  val tbl5: String = "tbl5"

  val relationships: Seq[Relationship] = Seq(
    Relationship(
      TableView(db, tbl1),
      TableView(db, tbl2),
      Seq(FieldPair(TableField(db, tbl1, tbl1, ""), TableField(db, tbl2, tbl2, "")))
    ),
    Relationship(
      TableView(db, tbl2),
      TableView(db, tbl3),
      Seq(FieldPair(TableField(db, tbl2, tbl2, ""), TableField(db, tbl3, tbl3, "")))
    ),
    Relationship(
      TableView(db, tbl3),
      TableView(db, tbl4),
      Seq(FieldPair(TableField(db, tbl3, tbl3, ""), TableField(db, tbl4, tbl4, "")))
    ),
    Relationship(
      TableView(db, tbl1),
      TableView(db, tbl5),
      Seq(FieldPair(TableField(db, tbl1, tbl1, ""), TableField(db, tbl5, tbl5, "")))
    ),
    Relationship(
      TableView(db, tbl5),
      TableView(db, tbl4),
      Seq(FieldPair(TableField(db, tbl5, tbl5, ""), TableField(db, tbl4, tbl4, "")))
    )
  )
  val graph = new RelationshipGraph(relationships)

  test("test bfs") {
    val startNode = TableView(db, tbl1)
    val targetNode = TableView(db, tbl4)
    val paths = graph.bfs(mutable.Queue(startNode), targetNode, mutable.HashMap.empty, mutable.Set.empty)

    assert(paths.length == 2)
    assert(
      paths == Seq(
        Relationship(
          TableView(db, tbl1),
          TableView(db, tbl5),
          Seq(FieldPair(TableField(db, tbl1, tbl1, ""), TableField(db, tbl5, tbl5, "")))
        ),
        Relationship(
          TableView(db, tbl5),
          TableView(db, tbl4),
          Seq(FieldPair(TableField(db, tbl5, tbl5, ""), TableField(db, tbl4, tbl4, "")))
        )
      )
    )
  }

  test("test dfs") {
    val startNode = TableView(db, tbl1)
    val targetNode = TableView(db, tbl4)
    val paths = graph.dfs(startNode, targetNode, Seq.empty, Set(startNode))

    assert(paths.length == 3)
    assert(
      paths == Seq(
        Relationship(
          TableView(db, tbl1),
          TableView(db, tbl2),
          Seq(FieldPair(TableField(db, tbl1, tbl1, ""), TableField(db, tbl2, tbl2, "")))
        ),
        Relationship(
          TableView(db, tbl2),
          TableView(db, tbl3),
          Seq(FieldPair(TableField(db, tbl2, tbl2, ""), TableField(db, tbl3, tbl3, "")))
        ),
        Relationship(
          TableView(db, tbl3),
          TableView(db, tbl4),
          Seq(FieldPair(TableField(db, tbl3, tbl3, ""), TableField(db, tbl4, tbl4, "")))
        )
      )
    )
  }
}
