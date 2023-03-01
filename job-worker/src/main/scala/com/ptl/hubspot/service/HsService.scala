package com.ptl.hubspot.service

import com.ptl.hubspot.client.Response
import com.ptl.hubspot.contact.Contact

/**
 * Created by phg on 6/28/21.
 **/
trait HsService {
  protected def exec[A](f: => Response[A])(success: A => Unit, failure: String => Unit): Unit = {
    val res = f
    if (res.isExceededLimit) failure("Hubspot API exceeded limit API call!")
    else if (res.isError) failure(s"Hubspot API failure ${res.code}: ${res.error.map(_.message)}")
    else res.data.foreach(success)
  }
}
