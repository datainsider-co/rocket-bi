package datainsider.admin.module

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import com.twitter.util.Future
import datainsider.admin.service.AdminUserService
import datainsider.client.exception.AlreadyExistError
import datainsider.user_profile.controller.http.request.RegisterRequest
import datainsider.user_profile.domain.Implicits.FutureEnhanceLike
import datainsider.user_profile.util.JsonParser
import datainsider.user_caas.domain.PasswordMode.PasswordMode
import datainsider.user_caas.domain.PasswordModeRef

import scala.io.Source

case class ConfigureAccount(
    email: String,
    password: Option[String],
    fullName: Option[String],
    @JsonScalaEnumeration(classOf[PasswordModeRef])
    passwordMode: Option[PasswordMode] = None
) {
  def toRegisterRequest: RegisterRequest = {
    RegisterRequest(
      email = email,
      password = password.getOrElse(""),
      fullName = fullName.getOrElse(""),
      gender = None,
      dob = None,
      nationality = None,
      nativeLanguages = None,
      isVerifyEnabled = Some(false),
      passwordMode = passwordMode
    )
  }
}

/**
  * This will create admin users by reading from a configure file.
  * @author andy
  * @author nkthien 08-11-2021 - turn off create user from file
  */
object AdminAccountModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val configAccounts = injector.instance[Seq[ConfigureAccount]]

    registerAccounts(injector, configAccounts)
  }

  @Singleton
  @Provides
  def providesConfigAccounts(): Seq[ConfigureAccount] = {
    readAccountThen("conf/users.json")(x => x)
  }

  private def readAccountThen[T](fileName: String)(fn: ConfigureAccount => T): Seq[T] = {
    val content = Source.fromFile(fileName, "UTF-8").getLines().mkString("\n")
    JsonParser
      .fromJson[Seq[ConfigureAccount]](content)
      .map(fn(_))
  }

  private def registerAccounts(injector: com.twitter.inject.Injector, configAccounts: Seq[ConfigureAccount]) = {
    val result = configAccounts.map(registerUser(injector, _)).toMap
    printCreatedResult(result)
  }

  private def registerUser(injector: com.twitter.inject.Injector, account: ConfigureAccount): (String, Boolean) = {
    val registrationService = injector.instance[AdminUserService]

    val registerOK = registrationService
      .createAdminAccount(0L, account) // create account for single tenant version only
      .map(_ != null)
      .rescue {
        case ex: AlreadyExistError => Future.True
        case ex =>
          logger.error(s"registerUser: $account", ex)
          Future.False
      }
      .syncGet()

    (account.email, registerOK)

  }

  private def printCreatedResult(resultMap: Map[String, Boolean]): Unit = {
    resultMap.foreach {
      case (email, status) =>
        info(s"Created $email: ${if (status) "Ok" else "Failed"}")
    }
    info(s"""
            |Total users: ${resultMap.size}
            |Created: ${resultMap.filter(_._2).size}
            |Failed: ${resultMap.filterNot(_._2).size}
            |--------------------------------------
            |""".stripMargin)
  }

}
