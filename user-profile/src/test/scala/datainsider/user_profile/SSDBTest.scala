package datainsider.user_profile

import com.google.inject.Guice
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.util.ZConfig
import datainsider.user_profile.module.UserProfileModule
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB


/**
 * @author anhlt
 */
class SSDBTest extends IntegrationTest {
  override protected def injector: Injector = Injector(Guice.createInjector(Seq(UserProfileModule): _*))

  private val emailKey = ZConfig.getString("db.ssdb.email_key")

  var client: SSDB = SSDBs.pool(
    "34.87.143.227",
    ZConfig.getInt("db.ssdb.port"),
    ZConfig.getInt("db.ssdb.timeout_in_ms"),
    null)


  test("Map email with user id") {
    val username = "up-47e4699e-e124-491c-bd10-6bb3956fd168"
    val email = "anbeel191@gmail.com"
  }

}