package co.datainsider.jobworker.hubspot

import co.datainsider.jobworker.hubspot.service.ContactService
import com.twitter.inject.Test

/**
  * Created by phg on 6/29/21.
 **/
class ContactServiceTest extends Test {
  private val contactService = ContactService("demo", debug = true)

  test("fetch all") {
    contactService.fetchAllContact()(println, println)
  }

  test("fetch recent") {
    contactService.fetchRecent(1L)(println, println)
  }
}
