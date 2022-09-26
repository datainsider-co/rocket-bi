package datainsider.user_profile.repository

import org.nutz.ssdb4j.spi.SSDB


class QuotaRepository(ssdb: SSDB) extends SSDBKeyValueRepository[String, Int](ssdb) {

  override def incr(k: String, num: Int): Int = {
    val resp = ssdb.incr(k, num)
    resp.ok() match {
      case true => resp.asInt()
      case false => throw new Exception("SSDBClient failed to incr")
    }
  }

  override def get(k: String): Option[Int] = {

    val resp = ssdb.get(k)
    resp.ok() match {
      case true => Some(resp.asInt())
      case false => resp.stat match {
        case "not_found" => None
        case _ => throw new Exception("SSDBClient failed to get.")
      }
    }
  }
}
