package co.datainsider.caas.user_caas.services

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Test
import datainsider.client.util.Using
import co.datainsider.caas.user_profile.util.JsonParser

import scala.io.Source

/**
  * @author andy
  * @since 8/12/20
  */
class ReadUserCredentialFromConfigTest extends Test {

  test("Read from config") {
    val content = Using(Source.fromFile("conf/users.json")) { source =>
      source.getLines().mkString("\n")
    }
    val json = JsonParser.fromJson[JsonNode](content)

    println(json)
  }
}
