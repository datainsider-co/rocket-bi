package co.datainsider.client

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.common.client.domain.kvs.SSDBCache
import co.datainsider.common.client.domain.kvs.Serializer.{JsonSerializer, StringSerializer}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.nutz.ssdb4j.spi.SSDB

import java.util.concurrent.ThreadLocalRandom

/**
  * created 2023-12-15 6:17 PM
  *
  * @author tvc12 - Thien Vi
  */
class CacheTest extends IntegrationTest {

  val clazz = getClass.getSimpleName

  override protected def injector: Injector = TestInjector(TestContainerModule).newInstance()

  val ssdb = injector.instance[SSDB]

  val cache = SSDBCache[String, ObjectSample](ssdb, "expired_map_test")(StringSerializer, new JsonSerializer[ObjectSample])

  private def generateKey(): String = {
    val key = ThreadLocalRandom.current().nextLong(10000, 100000000L)
    println(s"generate key: ${key}")
    String.valueOf(key)
  }

  private def generateValue(): ObjectSample = {
    ObjectSample(generateKey(), ThreadLocalRandom.current().nextInt(10, 100))
  }

  test(s"[$clazz] set key using default key") {
    val key = generateKey()
    val value = generateValue()
    cache.put(key, value)
    assert(cache.get(key).contains(value))
  }

  test(s"[$clazz] set expired key using custom key") {
    val key = generateKey()
    val value = generateValue()
    cache.put(key, value)
    assert(cache.get(key).contains(value))
  }

  test(s"[$clazz] test remove key") {
    val key = generateKey()
    val value = generateValue()
    cache.put(key, value)
    cache.remove(key)
    assert(cache.get(key).isEmpty)
  }
}

case class ObjectSample(name: String, age: Int)
