package datainsider.schema

import datainsider.schema.domain.ClickhouseSource
import datainsider.schema.domain.ClickhouseSource.ClickhouseSourceImplicit
import org.scalatest.FunSuite

/**
 * created 2022-07-21 5:17 PM
 *
 * @author tvc12 - Thien Vi
 */
 class ClickhouseSourceImplicitTest extends FunSuite {
  test("get host success") {
    val source = new ClickhouseSource("jdbc:clickhouse://clickhouse01:8123", "tvc12", "tvc12", "cluster")
    assert(source.getHost() == "clickhouse01")
    assert(source.getPort() == "8123")
  }

  test("get host success 2") {
    val source = new ClickhouseSource("jdbc:clickhouse://localhost:8123?loginTimeOut=123", "tvc12", "tvc12", "cluster")
    assert(source.getHost() == "localhost")
    assert(source.getPort() == "8123")
  }

  test("get host success 3") {
    val source = new ClickhouseSource("jdbc:clickhouse://dev.datainsider.co?loginTimeOut=123", "tvc12", "tvc12", "cluster")
    assert(source.getHost() == "dev.datainsider.co")
    assert(source.getPort() == "8123")
  }
}
