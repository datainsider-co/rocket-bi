package datainsider.user_profile

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.user.UserProfile
import datainsider.user_profile.module.{DBModule, UserProfileModule}
import datainsider.user_profile.service.verification.EmailFactory
import org.scalatest.BeforeAndAfterAll
import datainsider.user_caas.module.CaasModule

/**
 * @author sonpn
 */
class EmailFactoryTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(new TestServer().modules).create


  val emailFactory: EmailFactory = injector.instance[EmailFactory]

  test("Gen verify email") {
    val profile = UserProfile(
      username = "test",
      alreadyConfirmed = false,
      fullName = Some("Test Vegeta"),
      email = Some("test@gmail.com")
    )

    val (title: String, email: String) = emailFactory.buildRegisterVerificationEmail(profile, "123456", "")

    assertResult(true)(title != null)
    assertResult(true)(email != null)

    println(title)
    println(email)
  }

}
