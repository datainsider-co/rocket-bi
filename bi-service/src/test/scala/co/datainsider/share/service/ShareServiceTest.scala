/*
package co.datainsider.share.service

import co.datainsider.bi.MainApp
import co.datainsider.bi.domain.ResourceType
import co.datainsider.share.controller.request.{GetResourceSharingInfoRequest, MultiUpdateResourceSharingRequest, ShareAnyoneRequest, ShareWithUserRequest}
import co.datainsider.share.utils.ShareTestDbUtils
import com.twitter.inject.Injector
import com.twitter.inject.app.TestInjector
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  * @created 03/11/2021 - 10:55 AM
  */
class ShareServiceTest extends BaseServiceTest with BeforeAndAfterAll{
  override protected def injector: Injector = TestInjector(TestApp.modules).newInstance()

  private val shareService = injector.instance[ShareService]

  test("Share with users") {
    val results = await(
      shareService.share(
        1L,
        request = ShareWithUserRequest(ResourceType.Dashboard.toString, "111", Map("parents" -> Seq("view", "edit")))
      )
    )
    println(s"Share with users:: $results")
    assertResult(true)(results.nonEmpty)
  }

  test("Get resource sharing info") {
    val results = await(
      shareService.getInfo(
        1L,
        GetResourceSharingInfoRequest(ResourceType.Dashboard.toString, "1")
      )
    )
    println(s"Get resource sharing info:: $results")
    assertResult(true)(results != null)
  }

  test("Update resource sharing info") {
    val results = await(
      shareService.multiUpdate(
        1L,
        MultiUpdateResourceSharingRequest(ResourceType.Dashboard.toString, "1", Map("123" -> Seq("edit", "view")))
      )
    )
    println(s"Update resource sharing info:: $results")
    assertResult(true)(results != null)
  }

  test("Share with anyone") {
    val results = await(
      shareService.share(
        1L,
        ShareAnyoneRequest(ResourceType.Dashboard.toString, "1", Seq("view"))
      )
    )
    println(s"Share with anyone:: $results")
    assertResult(true)(results != null)
  }

  test("List resource id sharing") {
    val listing = await(
      shareService.listResourceIdSharing(
        1L,
        ResourceType.Dashboard.toString,
        "1"
      )
    )
    println(s"List resource id sharing:: $listing")
    assertResult(true)(listing != null)
  }

}
*/