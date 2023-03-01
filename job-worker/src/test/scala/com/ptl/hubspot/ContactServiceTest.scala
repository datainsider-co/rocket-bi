package com.ptl.hubspot

import com.ptl.hubspot.service.ContactService
import org.scalatest.FunSuite

/**
  * Created by phg on 6/29/21.
 **/
class ContactServiceTest extends FunSuite {
  private val contactService = ContactService("demo", debug = true)

  test("fetch all") {
    contactService.fetchAllContact()(println, println)
  }

  test("fetch recent") {
    contactService.fetchRecent(1L)(println, println)
  }
}
