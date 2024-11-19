package co.datainsider.caas.user_caas.controller

import org.apache.commons.codec.digest.HmacUtils

/**
  * @author sonpn
  */
object ToolGenPass {
  def main(args: Array[String]): Unit = {
    val username = "gg-113715195776897671484" // "gg-113715195776897671484"
    println(
      HmacUtils.hmacSha1Hex(
        (username + "17EIS514KMmQ1g1xxTzq9m86lh7727aF").getBytes(),
        "17EIS514KMmQ1g1xxTzq9m86lh7727aF".getBytes()
      )
    )
  }
}
