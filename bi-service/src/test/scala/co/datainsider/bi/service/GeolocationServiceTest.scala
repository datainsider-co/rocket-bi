/*
package co.datainsider.bi.service

import co.datainsider.bi.domain.Geolocation
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.repository.SchemaManager
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import org.scalatest.BeforeAndAfterAll

class GeolocationServiceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(MockCaasClientModule, MockSchemaClientModule, TestModule).newInstance()

  val service = injector.instance[GeolocationService]
  val schemaManager = injector.instance[SchemaManager]

  override def beforeAll() = {
    schemaManager.ensureDatabase()
  }

  test("insert") {
    val vn = Geolocation(
      "VN",
      "Viet Nam",
      "viet_nam",
      "Country",
      123.11,
      321.3,
      "some props"
    )
    val isSuccess = service.insert(vn)
    assert(Await.result(isSuccess))
  }

  test("insert child") {
    val child = Geolocation(
      "VN-HCM",
      "Ho Chi Minh",
      "ho_chi_minh",
      "city",
      42.11,
      56.3,
      "air_pollution_lvl: 9999"
    )
    val isSuccess = service.insert(child)
    assert(Await.result(isSuccess))
  }

  test("get") {
    val geoFromDb = service.get("VN")
    println(geoFromDb)
  }

}
*/
