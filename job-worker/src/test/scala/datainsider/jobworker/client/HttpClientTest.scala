package datainsider.jobworker.client

import org.scalatest.FunSuite

case class PingResponse(status: String, data: String)

class HttpClientTest extends FunSuite {

  val client = new SimpleHttpClient("http://localhost:5050/api/")

  /*test("to object") {
    val resp: PingResponse = client.get[PingResponse]("ping")
    println(resp)
  }*/

}
