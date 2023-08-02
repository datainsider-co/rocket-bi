package co.datainsider.jobworker.repository.utils

import co.datainsider.jobworker.repository.reader.MySqlUpdateQueryUtils
import co.datainsider.jobworker.repository.reader
import com.twitter.inject.Test
import org.scalatest.FunSuite

import scala.util.matching.Regex

class MySqlDbUtils extends Test {

  val dbUtils: MySqlUpdateQueryUtils = MySqlUpdateQueryUtils()
  test("test adjust limit offset of query statement ") {
    val query = "select name as limit from db.tbl limit 1000 offset 0"
    val newQuery = dbUtils.rebuildQueryStatement(query, 200, 0)
    println(newQuery)
    val expectedQuery = "select name as limit from db.tbl  limit 0 offset 200"
    assert(newQuery == expectedQuery)
  }
  test("regex") {

  }
}
