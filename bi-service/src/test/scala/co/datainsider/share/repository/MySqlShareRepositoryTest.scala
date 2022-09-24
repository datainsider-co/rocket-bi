/*
package co.datainsider.share.repository

import co.datainsider.share.service.TestApp
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * @author tvc12 - Thien Vi
  * @created 03/11/2021 - 2:26 PM
  */
class MySqlShareRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestApp.modules).newInstance()
  val mySqlShareRepository = injector.instance[ShareRepository]
  val orgId = 1L
  val resourceType = "dashboard"
  val resourceId = "1"
  val username = "tvc12"
  val usernames = Seq("tvc12", "thienlan12", "trunghau", "thiennguyen", "thuantran", "hao")
  var shareIds = Seq.empty[String]

  test("Share with users") {
    val resp = await(mySqlShareRepository.shareWithUsers(orgId, resourceType, resourceId, usernames, username))
    println(s"Share with users:: $resp")
    assertResult(true)(resp)
  }

  test("Get resourceIds") {
    val resp = await(mySqlShareRepository.getResourceIds(orgId, resourceType, username, 0, 20))
    println(s"Get resourceIds:: $resp")
    assertResult(true)(resp.total > 0)
    assertResult(true)(resp.data.nonEmpty)
    shareIds = resp.data
    println(shareIds)
  }

  test("Get sharing infos by id") {
    val resp = await(mySqlShareRepository.getSharingInfos(shareIds))
    println(s"Get sharing infos by id:: $resp")
    //assertResult(true)(resp.nonEmpty)
  }

  test("get all sharing infos") {
    val resp = await(mySqlShareRepository.getAllSharingInfos(orgId, resourceId, resourceType))
    println(resp)
    assertResult(true)(resp.nonEmpty)
  }

  test("Get sharing infos by org") {
    val resp = await(mySqlShareRepository.getSharingInfos(orgId, resourceType, resourceId, 0, 20))
    println(s"Get sharing infos by org:: $resp")
    assertResult(true)(resp.total > 0)
    assertResult(true)(resp.data.nonEmpty)
  }

  test("Update time updated of share info") {
    val resp = await(mySqlShareRepository.updateUpdatedTimeShareInfo(shareIds))
    println(s"Update time updated of share info $resp")
    assertResult(true)(resp)
  }

  test("Soft remove") {
    val resp = await(mySqlShareRepository.softDelete(orgId, resourceType, resourceId, usernames))
    println(s"soft remove $resp")
    assertResult(true)(resp)
  }
}
*/
