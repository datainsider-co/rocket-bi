package co.datainsider.schema

import co.datainsider.bi.engine.ExpressionUtils
import org.scalatest.FunSuite

class TableExpressionsUtilsTest extends FunSuite {

  test("test find simple dbName, tblName") {
    val sql =
      """
        |select * from  dbName.tableName
        |""".stripMargin

    val schemaNames = ExpressionUtils.findDbTblNames(sql)
    assert(schemaNames.size == 1)
    assert(schemaNames.head == ("dbName", "tableName"))
  }

  test("test find dbName, table name case insensitive") {
    val sql =
      """
        |SELECT *  FrOm  dbName.tableName
        |""".stripMargin

    val schemaNames = ExpressionUtils.findDbTblNames(sql)
    assert(schemaNames.size == 1)
    assert(schemaNames.head == ("dbName", "tableName"))
  }

  test("test find dbName, tblName in multiline query") {
    val sql =
      """
        |select * 
        |from dbName.tableName 
        |""".stripMargin

    val schemaNames = ExpressionUtils.findDbTblNames(sql)
    assert(schemaNames.size == 1)
    assert(schemaNames.head == ("dbName", "tableName"))
  }

  test("test find dbName, tblName in subquery") {
    val sql =
      """
        |select * from (select a,b   from dbName.tableName)
        |""".stripMargin

    val schemaNames = ExpressionUtils.findDbTblNames(sql)
    assert(schemaNames.size == 1)
    assert(schemaNames.head == ("dbName", "tableName"))
  }

  test("test find in view") {
    val sql =
      """
        |select * from viewName
        |""".stripMargin

    val schemaNames = ExpressionUtils.findDbTblNames(sql)
    assert(schemaNames.isEmpty)
  }

}
