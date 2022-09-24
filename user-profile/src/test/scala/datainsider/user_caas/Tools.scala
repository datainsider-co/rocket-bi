//package xed.caas.controller
//
//import education.x.util.DataSourceBuilder
//import org.apache.commons.lang3.SerializationUtils
//import org.apache.shiro.session.mgt.SimpleSession
//import redis.clients.jedis.JedisPool
//import xed.caas.repository.RedisSessionRepository
//import xed.caas.service.Caas
//import xed.caas.util.ZConfig
//
///**
// * @author sonpn
// */
//object Tools {
//
//  def providesRedisPool(): JedisPool = {
//    import redis.clients.jedis.JedisPoolConfig
//
//    val host = ZConfig.getString("redis.host")
//    val port = ZConfig.getInt("redis.port")
//    val authPass = ZConfig.getString("redis.auth_pass", null)
//    val timeout = ZConfig.getInt("redis.timeout", 15)
//    val maxTimeoutInMillis = ZConfig.getInt("redis.max_timeout_millis", 60000)
//
//    val poolConfig = new JedisPoolConfig
//    poolConfig.setMaxWaitMillis(maxTimeoutInMillis)
//    poolConfig.setMaxTotal(16)
//    poolConfig.setTestWhileIdle(true)
//    new JedisPool(
//      poolConfig,
//      host,
//      port,
//      timeout,
//      authPass
//    )
//  }
//
//  def main(args: Array[String]): Unit = {
//    val dbName: String = ZConfig.getString("SQLAuthen.dbname")
//    val host: String = ZConfig.getString("SQLAuthen.host")
//    val port: Int = ZConfig.getInt("SQLAuthen.port")
//    val username: String = ZConfig.getString("SQLAuthen.username")
//    val password: String = ZConfig.getString("SQLAuthen.password")
//    val ds = DataSourceBuilder.buildMySQLDataSource(host, port, dbName, username, password)
//
//    val sessionDAO =  RedisSessionRepository(
//      providesRedisPool(),
//      serializer= (session)  => SerializationUtils.serialize(session.asInstanceOf[SimpleSession]),
//      deserializer = (data: Array[Byte]) => SerializationUtils.deserialize[SimpleSession](data)
//    )
//
//    val caas = new Caas(ds, sessionDAO)
//
//    val ssid = caas.login("up-fc530acc-222b-4888-8ffd-4892949c4be7", "02Ix9XHeGpoppozDXTCn7Q==", false, 100000)
//    println(ssid)
//    println(caas.getUser(ssid))
//
//
//    val ssidOAuth = caas.loginOAuth("up-fc530acc-222b-4888-8ffd-4892949c4be7", false, 100000)
//    println(ssidOAuth)
//    println(caas.getUser(ssidOAuth))
//
//
//    caas.logout(ssid)
//    caas.logout(ssidOAuth)
//  }
//}
