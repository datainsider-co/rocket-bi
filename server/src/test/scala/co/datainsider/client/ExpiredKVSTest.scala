package co.datainsider.client

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.common.client.domain.kvs.Serializer.{JsonSerializer, StringSerializer}
import co.datainsider.common.client.domain.kvs.{Serializer, SsdbExpiredKVS}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.nutz.ssdb4j.spi.SSDB

import java.util.concurrent.ThreadLocalRandom

/**
 * created 2023-12-15 6:17 PM
 *
 * @author tvc12 - Thien Vi
 */
 class ExpiredKVSTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestContainerModule).create

  val ssdb = injector.instance[SSDB]

  val expiredKvs = SsdbExpiredKVS[String, String](ssdb, "expired_map_test", 100, 1000)

  private def generateKey(): String = {
    val key = ThreadLocalRandom.current().nextLong(10000, 100000000L)
    println(s"generate key: ${key}")
    String.valueOf(key)
  }

  test("set expired key using default key") {
    val key = generateKey()
    val value = generateKey()
    expiredKvs.put(key, value)
    assert(expiredKvs.get(key).contains(value))
  }

  test("set expired key using custom key") {
    val key = generateKey()
    val value = generateKey()
    val expiredTimeMs = 1000
    expiredKvs.put(key, value, expiredTimeMs)
    assert(expiredKvs.get(key).contains(value))
  }

  test("test expired key working") {
    val key = generateKey()
    val value = generateKey()
    val expiredTimeMs = 1000
    expiredKvs.put(key, value, expiredTimeMs)
    Thread.sleep(expiredTimeMs + 100)
    assert(expiredKvs.get(key).isEmpty)
  }

    test("test remove key") {
      val key = generateKey()
      val value = generateKey()
      val expiredTimeMs = 1000
      expiredKvs.put(key, value, expiredTimeMs)
      expiredKvs.remove(key)
      assert(expiredKvs.get(key).isEmpty)
    }

  test("test get all") {
    val key1 = generateKey()
    val value1 = "value1"
    val key2 = generateKey()
    val value2 = "value2"
    val expiredTimeMs = 500000
    expiredKvs.put(key1, value1, expiredTimeMs)
    expiredKvs.put(key2, value2, expiredTimeMs)
    val all = expiredKvs.getAll()
    assert(all.contains(key1))
    assert(all.contains(key2))
  }

  test("test get value with value is object") {
    val key = generateKey()
    val map = SsdbExpiredKVS(ssdb, "test_map", 100, 1000)(StringSerializer, new JsonSerializer[TestClass]())
    val expected = new TestClass("value1", 1)
    val expiredTimeMs = 50000
    map.put(key, expected, expiredTimeMs)
    val all = map.getAll()
    assert(all.contains(key))
    assert(all(key) == expected)

    val value = map.get(key)
    assert(value.contains(expected))
  }
}

private case class TestClass(name: String, age: Int)
