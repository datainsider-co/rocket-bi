package co.datainsider.bi.utils

import co.datainsider.bi.engine.ExpressionUtils
import org.scalatest.FunSuite

class ExpressionUtilsTest extends FunSuite {

  test("test findExprFields") {
    val targets = Set("total_cost_usd", "revenue_usd", "revenue_vnd")
    val sql = "select total_cost_usd, revenue_vnd from test_db.sale where revenue_vnd > 1"
    val fields = ExpressionUtils.findExprFields(sql, targets)

    assert(fields.size == 2)
    assert(fields == Set("total_cost_usd", "revenue_vnd"))
  }

  test("test findFromClause from sql") {
    val sql =
      """select total_cost_usd, revenue_usd 
        |from (select * From test_db.sale left join user_db.users on order_id = user_id)
        |""".stripMargin

    val dbTblNames = ExpressionUtils.findDbTblNames(sql)

    assert(dbTblNames.length == 2)
    assert(dbTblNames == Seq(("test_db", "sale"), ("user_db", "users")))
  }

  test("test parseToFullExpression ") {
    val expressions = Map(
      "total_cost_usd" -> "sum(Total_Cost)/23000",
      "total_cost_usd_x1000" -> "total_cost_usd*1000"
    )

    val sql = s"select total_cost_usd_x1000 from dbName.tblSales group by Region"

    val finalSql = ExpressionUtils.parseToFullExpr(sql, expressions)

    assert(finalSql.contains("sum(Total_Cost)/23000"))
    assert(!finalSql.contains("total_cost_usd_x1000"))
  }

  test("test parseToFullExpression 2") {
    val expressions = Map(
      "a" -> "sum(Total_Revenue)",
      "b" -> "count(Order_ID)"
    )

    val sql = s"select a/b from database_test.table_sales"

    val finalSql = ExpressionUtils.parseToFullExpr(sql, expressions)
    println(finalSql)

    assert(finalSql.contains("sum(Total_Revenue)"))
    assert(finalSql.contains("count(Order_ID)"))
  }

  test("test check is apply all expression") {
    val computeWords = Seq(
      "#",
      "# ",
      " #",
      "  #  "
    )
    computeWords.foreach(compute => {
      val expr = s"$compute(count(*))"
      val isComputeExpr = ExpressionUtils.isApplyAllExpr(expr)
      assert(isComputeExpr)
    })

  }

  test("test is not an apply all expression") {
    val expr = "count(*)"
    val isApplyAllExpr = ExpressionUtils.isApplyAllExpr(expr)
    assert(!isApplyAllExpr)
  }

  test("test get main expression") {
    val expressions = Seq(
      "#(count(*))",
      " #(count(*))",
      "# ( count(*) )"
    )
    expressions.foreach(expr => {
      val mainExpr = ExpressionUtils.getMainExpression(expr)
      println(mainExpr)
      assert(mainExpr.trim == "count(*)")
    })
  }

}
