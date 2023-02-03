package co.datainsider.bi.utils

import co.datainsider.bi.module.TestModule
import co.datainsider.bi.util.StringUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import org.scalatest.FunSuite

class StringUtilsTest extends FunSuite {

  val locations = Seq(
    "viet_nam",
    "china",
    "united_state_of_america",
    "russia",
    "korea_republic_of",
    "france",
    "spain",
    "singapore",
    "ho_chi_minh_city",
    "laos",
    "japan",
    "germany",
    "brazil",
    "mali",
    "somali",
    "thai_land",
    "malaysia",
    "indonesia"
  )

  val testDataSuccess: Map[Seq[String], Option[String]] = Map(
    Seq("Viet Nam", "Việt Nam", "VietNam") -> Some("viet_nam"),
    Seq("Singapore", "Sin-ga-po", "Sin ga pore") -> Some("singapore")
  )
  val testDataFail: Map[Seq[String], Option[String]] = Map(
    Seq("USA", "Canada", "Mexico") -> None
  )

  test("find closest string successful test") {
    testDataSuccess.foreach(Info =>
      Info._1.foreach(str =>
        assert(StringUtils.findClosestString(StringUtils.normalizeVietnamese(str), locations).contains(Info._2.get))
      )
    )
  }

  test("find closest string fail test") {
    testDataFail.foreach(Info =>
      Info._1.foreach(str =>
        assert(StringUtils.findClosestString(StringUtils.normalizeVietnamese(str), locations).isEmpty)
      )
    )
  }

  test("normalize test") {
    assert(StringUtils.normalizeVietnamese("Bắc Kạn").equals("bac_kan"))
  }

  test("test match decrypt function") {
    val sql = s"select decrypt(phone_number), decrypt(card_number) from users"

    val algorithm = "aes-256-gcm"
    val key = "2f17958458160187530dcdbdc0ce892fb67a18100733ec35b0f713a5790b765d"
    val iv = "d4fcb696b6e8e06b4a3cdc630e8176b7"

    val finalSql = sql.replaceAll(
      """decrypt\(([`" ]*\w+[`" ]*)\)""",
      s"decrypt('$algorithm', $$1, unhex('$key'), unhex('$iv'))"
    )

    val expectedSql =
      "select decrypt('aes-256-gcm', phone_number, unhex('2f17958458160187530dcdbdc0ce892fb67a18100733ec35b0f713a5790b765d'), unhex('d4fcb696b6e8e06b4a3cdc630e8176b7')), decrypt('aes-256-gcm', card_number, unhex('2f17958458160187530dcdbdc0ce892fb67a18100733ec35b0f713a5790b765d'), unhex('d4fcb696b6e8e06b4a3cdc630e8176b7')) from users"
    assert(finalSql == expectedSql)

    println(finalSql)
  }

  test("test hash md5 string") {
    assert(StringUtils.md5("hello") == "5d41402abc4b2a76b9719d911017c592")
    assert(StringUtils.md5("world") == "7d793037a0760186574b0282f2f435e7")
    assert(StringUtils.md5("helloworld") == "fc5e038d38a57032085441e7fe7010b0")
  }

}
