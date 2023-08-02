//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.jobworker.domain.source.FacebookAdsSource
//import co.datainsider.jobworker.service.handler.SourceMetadataHandler
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.Test
//import com.twitter.util.Await
//import org.scalatest.FunSuite
//
//class FacebookAdsMetadataHandler extends Test {
//
//  val appSecret: String = ZConfig.getString("facebook_ads.app_secret")
//  val appId: String = ZConfig.getString("facebook_ads.app_id")
//
//  val source: FacebookAdsSource = FacebookAdsSource(
//    id = -1,
//    displayName = "test",
//    accessToken =
//      "EAATfsNsedB0BAJ8JD3UJY4ld73eQobqEZCGQweWzXkR6IkxjHpkwgA0ZAx8Eb5TqkavoXgFlcZA9JZAJadRV3XwLMBsm1Plg1x91cREGh2aftDD53mQZACxL54jYZBnZC3Rpsc3PcX9ggIL7TZBpZB99C34hCemhFvZC0mPujId2hxT6wTgVLHKMAxOZCZA6jjyofZCUZD"
//  )
//
//  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
//
//  test("fb ads test connection") {
//    val connected = Await.result(sourceHandler.testConnection())
//    assert(connected)
//  }
//
//  test("fb ads list db") {
//    val databases: Seq[String] = Await.result(sourceHandler.listDatabases())
//    assert(databases.nonEmpty)
//    println(databases.mkString(", "))
//  }
//
//  test("fb ads list table") {
//    val tables: Seq[String] = Await.result(sourceHandler.listTables(""))
//    assert(tables.nonEmpty)
//    println(tables.mkString(", "))
//  }
//
//}
