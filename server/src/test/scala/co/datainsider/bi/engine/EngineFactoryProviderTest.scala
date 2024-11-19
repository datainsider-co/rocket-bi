package co.datainsider.bi.engine

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.clickhouse.ClickhouseEngineFactory
import co.datainsider.bi.engine.factory.{EngineFactory, EngineFactoryProvider}
import co.datainsider.common.client.exception.NotFoundError
import com.twitter.inject.Test

import scala.reflect.{ClassTag, classTag}

/**
  * created 2023-05-31 4:06 PM
  *
  * @author tvc12 - Thien Vi
  */
class EngineFactoryProviderTest extends Test {
  test("test engine factory create success") {
    val factoryProvider = EngineFactoryProvider()
    factoryProvider.register(new ClickhouseEngineFactory())
    val factory = factoryProvider.get(classTag[ClickhouseConnection])
    assert(factory.isInstanceOf[ClickhouseEngineFactory])
    assert(factory.isInstanceOf[EngineFactory[ClickhouseConnection]])
  }

  test("test create engine factory by getClass") {
    val factoryProvider = EngineFactoryProvider()
    factoryProvider.register(new ClickhouseEngineFactory())
    val clickhouseConnection = new ClickhouseConnection(0L, "", "", "", 0, 0)
    val factory = factoryProvider.get(ClassTag(clickhouseConnection.getClass))
    assert(factory.isInstanceOf[ClickhouseEngineFactory])
    assert(factory.isInstanceOf[EngineFactory[ClickhouseConnection]])
  }

  test("test engine factory create fail") {
    val factoryProvider = EngineFactoryProvider()
    assertThrows[NotFoundError](factoryProvider.get(classTag[ClickhouseConnection]))
  }
}
