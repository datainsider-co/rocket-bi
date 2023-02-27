package datainsider.jobworker.service.handlers

import com.twitter.util.Await
import datainsider.jobworker.domain.source.FacebookAdsSource
import datainsider.jobworker.service.handler.SourceMetadataHandler
import datainsider.jobworker.util.ZConfig
import org.scalatest.FunSuite

class FacebookAdsMetadataHandler extends FunSuite {

  val appSecret: String = ZConfig.getString("facebook_ads.app_secret")
  val appId: String = ZConfig.getString("facebook_ads.app_id")

  val source: FacebookAdsSource = FacebookAdsSource(
    id = -1,
    displayName = "test",
    accessToken =
      "EAAL6rO2TSzsBAF42m9yEFwCyTjawLX4l3rie5Xx10nFzKziJWiJk3ZCiLdyxY302NJAZCGMZCM4DlZCGRiUGBkGV9OrrpX4MAnVONDbO0UhEMDZBdh3rWtuZCOB7NYZBFpN4OXuawiJZBapJ0WaNbNj79GRZCZCGA80prcIZCNJ1YOnSYktLy3qhR0jwwOhtPMRBHlBEAl7bScZCTqN5N4Ketkt4T7g1ugJEH30ZD"
  )

  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)

  test("fb ads test connection") {
    val connected = Await.result(sourceHandler.testConnection())
    assert(connected)
  }

  test("fb ads list db") {
    val databases: Seq[String] = Await.result(sourceHandler.listDatabases())
    assert(databases.nonEmpty)
    println(databases.mkString(", "))
  }

  test("fb ads list table") {
    val tables: Seq[String] = Await.result(sourceHandler.listTables(""))
    assert(tables.nonEmpty)
    println(tables.mkString(", "))
  }

}
