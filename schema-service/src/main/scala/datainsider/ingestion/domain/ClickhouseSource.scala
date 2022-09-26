package datainsider.ingestion.domain

import com.twitter.finatra.validation.constraints.NotEmpty

import java.net.URI

/**
  * created 2022-07-21 5:02 PM
  *
  * @author tvc12 - Thien Vi
  */
object ClickhouseSource {
  implicit class ClickhouseSourceImplicit(val value: ClickhouseSource) extends AnyVal {

    def getHost(): String = {
      getUri().getHost
    }

    private def getUri(): URI = {
      URI.create(value.jdbcUrl.replace("jdbc:", ""))
    }

    /**
      * Get the port of from jdbc url, default port is 8123
      */
    def getPort(): String = {
      val port: Int = getUri().getPort
      if (port == -1) {
        "8123"
      } else {
        port.toString
      }
    }
  }
}

@SerialVersionUID(20220720L)
case class ClickhouseSource(
    @NotEmpty jdbcUrl: String,
    @NotEmpty username: String,
    password: String,
    clusterName: String
)
