package co.datainsider.caas.user_profile.repository

import org.nutz.ssdb4j.spi.SSDB

import scala.collection.JavaConversions._

class TokenCodeRepository(ssdb: SSDB) extends SSDBKeyValueRepository[String, String](ssdb: SSDB) {

  override def get(k: String): Option[String] = {
    val resp = ssdb.get(k)
    resp.ok() match {
      case true => Some(resp.asString())
      case false =>
        resp.stat match {
          case "not_found" => None
          case _           => throw new Exception("SSDBClient failed to get.")
        }
    }
  }

  override def gets(k: Seq[String]): Map[String, String] = {
    var result: Map[String, String] = Map.empty
    val resp = ssdb.multi_get(k: _*)
    if (resp.ok() && resp.datas != null && resp.datas.size() > 0) {
      resp.datas.zipWithIndex.collect {
        case (i, idx) if idx % 2 == 0 => {
          result += (new String(resp.datas.get(idx), resp.charset) -> new String(resp.datas.get(idx + 1), resp.charset))
        }
      }
    }
    result
  }
}
