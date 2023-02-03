package co.datainsider.bi.utils

import co.datainsider.bi.engine.TableExpressionUtils
import org.scalatest.FunSuite

class TableExpressionUtilsTest extends FunSuite {

  test("test findExprFields") {
    val targets = Set("total_cost_usd", "revenue_usd", "revenue_vnd")
    val sql = "select total_cost_usd, revenue_vnd from test_db.sale where revenue_vnd > 1"
    val fields = TableExpressionUtils.findExprFields(sql, targets)

    assert(fields.size == 2)
    assert(fields == Set("total_cost_usd", "revenue_vnd"))
  }

  test("test findFromClause from sql") {
    val sql =
      """select total_cost_usd, revenue_usd 
        |from (select * From test_db.sale left join user_db.users on order_id = user_id)
        |""".stripMargin

    val dbTblNames = TableExpressionUtils.findFromClause(sql)

    assert(dbTblNames.length == 2)
    assert(dbTblNames == Seq(("test_db", "sale"), ("user_db", "users")))
  }

  test("test parseToFullExpression ") {
    val expressions = Map(
      "total_cost_usd" -> "sum(Total_Cost)/23000",
      "total_cost_usd_x1000" -> "total_cost_usd*1000"
    )

    val sql = s"select total_cost_usd_x1000 from dbName.tblSales group by Region"

    val finalSql = TableExpressionUtils.parseToFullExpressions(sql, expressions)

    assert(finalSql.contains("sum(Total_Cost)/23000"))
    assert(!finalSql.contains("total_cost_usd_x1000"))
  }

}
