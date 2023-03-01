package com.ptl.hubspot.client

import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.{AtomicBoolean, AtomicReference}

import com.ptl.util.JsonUtil._
import scalaj.http.{Http, HttpRequest, HttpResponse, MultiPart}

import scala.concurrent.duration.Duration
import scala.reflect.runtime.universe._

/**
 * Created by phuonglam on 2/16/17.
 **/
trait HubspotClient {
  protected val apiUrl = s"https://api.hubapi.com"

  protected def http: HttpClient

  protected def buildBasicHeaders(cookiesStr: String): Map[String, String] = {
    val cookies = parseCookie(cookiesStr)
    Map(
      "Cookie" -> cookiesStr,
      "X-HubSpot-CSRF-hubspotapi" -> getHubspotCRSF(cookies)
    )
  }

  protected def parseCookie(cookies: String): Map[String, String] = {
    cookies.split(";").flatMap(f => {
      val splits = f.split("=")
      if (splits.length == 2) Some(splits(0) -> splits(1)) else None
    }).toMap[String, String]
  }

  protected def getHubspotCRSF(cookies: Map[String, String]): String = cookies.getOrElse("hubspotapi-csrf", "")
}

class APIKetHubspotClient(
  hapiKey: String,
  connTimeout: Duration = Duration(60, TimeUnit.SECONDS),
  readTimeout: Duration = Duration(60, TimeUnit.SECONDS),
  debug: Boolean = false
) extends HubspotClient {
  override protected def http: HttpClient = APIKeyHttpClient(hapiKey, connTimeout, readTimeout, debug = debug)
}

class OAuthHubspotClient(
  config: OAuthConfig,
  connTimeout: Duration = Duration(60, TimeUnit.SECONDS),
  readTimeout: Duration = Duration(60, TimeUnit.SECONDS),
  debug: Boolean = false
) extends HubspotClient {
  override protected def http: HttpClient = OAuthHttpClient(config, connTimeout, readTimeout, debug)
}

abstract class HttpClient {

  def makeHttpRequest(path: String, headers: Map[String, String] = Map()): HttpRequest

  def isDebug: Boolean

  def GET[A: Manifest](path: String, params: Seq[(String, String)] = Seq(), headers: Map[String, String] = Map()): Response[A] = {
    val req = makeHttpRequest(path, headers).params(params)
    val res = req.asString
    printRequest(req, res)
    extract[A](res)
  }

  def POST[A: Manifest](path: String, data: String, params: Seq[(String, String)] = Seq(), headers: Map[String, String] = Map()): Response[A] = {
    val req = makeHttpRequest(path, headers).params(params).postData(data)
    val res = req.asString
    printRequest(req, res, data)
    extract[A](res)
  }

  def POST_MULTI[A: Manifest](path: String, data: Seq[MultiPartData], params: Seq[(String, String)] = Seq(), headers: Map[String, String] = Map()): Response[A] = {
    val multiParts = data.map(f => {
      f.data match {
        case x if x.isInstanceOf[Array[Byte]] => MultiPart(f.name, f.filename, f.mime, f.data.asInstanceOf[Array[Byte]])
        case x => MultiPart(f.name, f.filename, f.mime, x.toString)
      }
    })
    val req = makeHttpRequest(path, headers).params(params).postMulti(multiParts: _*)
    val res = req.asString
    printRequest(req, res, data.toString)
    extract[A](res)
  }

  def PUT[A: Manifest](path: String, data: String, params: Seq[(String, String)] = Seq(), headers: Map[String, String] = Map()): Response[A] = {
    val req = makeHttpRequest(path, headers).params(params).put(data)
    val res = req.asString
    printRequest(req, res, data)
    extract[A](res)
  }

  def PATCH[A: Manifest](path: String, data: String, params: Seq[(String, String)] = Seq(), headers: Map[String, String] = Map()): Response[A] = {
    val req = makeHttpRequest(path, headers).params(params).put(data).method("PATCH")
    val res = req.asString
    printRequest(req, res, data)
    extract[A](res)
  }

  protected def extract[A: Manifest](res: HttpResponse[String]): Response[A] = {
    Response(
      code = res.code,
      data = if (res.isNotError && res.body.nonEmpty && !(typeOf[A] =:= typeOf[NobodyResponse])) {
        Some(res.body.asJsonObject[A])
      } else None,
      error = if (res.isError && res.body.nonEmpty) {
        Some(res.body.asJsonObject[Error])
      } else None
    )
  }

  protected def printRequest(req: HttpRequest, res: HttpResponse[String], body: String = ""): Unit = {
    if (isDebug) {
      println("")
      println(s"-----------------[Request]------------------------")
      println(s"${req.method} ${req.url}${
        if (req.params.nonEmpty) s"?${req.params.map(f => s"${f._1}=${f._2}").mkString("&")}" else ""
      }")
      req.params.foreach(f => {
        println(s"[Param] ${f._1} -> ${f._2}")
      })
      req.headers.foreach(f => {
        println(s"[Header]  ${f._1} -> ${f._2.toString}")
      })
      println(s"[Body] $body")
      println(s"-----------------[Response]------------------------")
      println(s"[Status]  ${res.code}")
      res.headers.foreach(f => {
        println(s"[Header]  ${f._1} -> ${f._2.toString}")
      })
      println(s"[Body] ${res.body}")
    }
  }

  def DELETE[A: Manifest](path: String, headers: Map[String, String] = Map()): Response[A] = {
    val req = makeHttpRequest(path, headers).method("DELETE")
    val res = req.asString
    printRequest(req, res)
    extract[A](res)
  }
}

case class APIKeyHttpClient(hapiKey: String, connTimeout: Duration, readTimeout: Duration, debug: Boolean = false) extends HttpClient {

  override def isDebug: Boolean = debug

  override def makeHttpRequest(path: String, headers: Map[String, String] = Map()): HttpRequest = {
    val _headers = Map(
      "Content-Type" -> "application/json;charset=utf-8"
    ) ++ headers

    Http(path).timeout(connTimeoutMs = connTimeout.toMillis.toInt, readTimeoutMs = readTimeout.toMillis.toInt)
      .param("hapikey", hapiKey)
      .headers(_headers)
  }
}

case class OAuthHttpClient(oauthConfig: OAuthConfig, connTimeout: Duration, readTimeout: Duration, debug: Boolean = false) extends HttpClient {
  val tokenUri = "https://api.hubapi.com/oauth/v1/token"
  val accessTokenInfoUri = "https://api.hubapi.com/oauth/v1/access-tokens"
  val refreshTokenInfoUri = "https://api.hubapi.com/oauth/v1/refresh-tokens"

  val clientId: String = oauthConfig.clientId
  val clientSecret: String = oauthConfig.clientSecret

  val refreshToken: String = oauthConfig.refreshToken
  val accessToken = new AtomicReference[String](oauthConfig.accessToken match {
    case Some(x) => x
    case _ => null
  })

  val scheduler: RefreshTokenScheduler = new RefreshTokenScheduler {
    override def doRefreshToken(): Option[AccessToken] = {
      refreshAccessToken(tokenUri, clientId, clientSecret, refreshToken) match {
        case Some(x) =>
          println(s"New access token: ${x.token}, expireTime: ${x.expiresIn}")
          accessToken.set(x.token)
          Some(x)
        case _ => None
      }
    }

    override def notifyRefreshTokenFailed(msg: String): Unit = println(msg)
  }

  verifyToken()

  override def makeHttpRequest(path: String, headers: Map[String, String] = Map()): HttpRequest = {
    val _headers = Map(
      "Authorization" -> s"Bearer ${accessToken.get()}",
      "Content-Type" -> "application/json;charset=utf-8"
    ) ++ headers
    Http(path).timeout(connTimeout.toMillis.toInt, readTimeout.toMillis.toInt).headers(_headers)
  }

  override def isDebug: Boolean = debug

  private[this] def verifyToken(): Unit = {
    if (refreshToken == null || refreshToken.isEmpty) throw new Exception("refresh token is empty")
    if (getRefreshTokenInfo(refreshToken).isEmpty) throw new Exception("refresh token is invalid")

    (if (accessToken.get() == null || accessToken.get().isEmpty) refreshAccessToken(tokenUri, clientId, clientSecret, refreshToken)
    else {
      val accessTokenInfo = getAccessTokenInfo(accessToken.get())
      if (accessTokenInfo.isEmpty) refreshAccessToken(tokenUri, clientId, clientSecret, refreshToken) else accessTokenInfo
    }) match {
      case Some(x) =>
        println(s"Access token: ${x.token}, expireTime: ${x.expiresIn}")
        accessToken.set(x.token)
        scheduler.setSleepTime(x.expiresIn)
        scheduler.start()
      case _ => throw new Exception("Failed when refresh access token")
    }
  }

  private def refreshAccessToken(tokenUri: String, clientId: String, clientSecret: String, refreshToken: String): Option[AccessToken] = {
    val resp = Http(tokenUri).timeout(connTimeout.toMillis.toInt, readTimeout.toMillis.toInt)
      .method("POST")
      .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
      .param("grant_type", "refresh_token")
      .param("client_id", clientId)
      .param("client_secret", clientSecret)
      .param("refresh_token", refreshToken).asString
    resp.code match {
      case 200 =>
        val token = resp.body.asJsonObject[Token]
        Some(AccessToken(token.accessToken, token.expiresIn))
      case _ => None
    }
  }

  private def getRefreshTokenInfo(refreshToken: String): Option[RefreshToken] = {
    val res = Http(s"$refreshTokenInfoUri/$refreshToken").timeout(connTimeout.toMillis.toInt, readTimeout.toMillis.toInt).asString
    if (res.code < 300) Some(RefreshToken()) else None
  }

  private def getAccessTokenInfo(accessToken: String): Option[AccessToken] = {
    val res = Http(s"$accessTokenInfoUri/$accessToken").timeout(connTimeout.toMillis.toInt, readTimeout.toMillis.toInt).asString
    if (res.code < 300) Some(res.body.asJsonObject[AccessToken]) else None
  }
}

abstract class RefreshTokenScheduler extends Thread {
  val isRunning = new AtomicBoolean(false)
  val deltaSleep: Int = 1 * 60 * 60
  val sleepTimeWhenFailed: Long = 5000l
  val maxRetries: Int = 10
  var sleepTimeInSecond: Int = -1
  var currentRetry: Int = 0

  override def run(): Unit = {
    while (isRunning.get()) {
      val timeSleep = (sleepTimeInSecond - deltaSleep) * 1000l
      if (timeSleep > 0) {
        Thread.sleep(timeSleep)
      }
      sleepTimeInSecond = 0
      try {
        doRefreshToken() match {
          case Some(x) => sleepTimeInSecond = x.expiresIn
          case _ => executeFailed("Failed when refresh access token")
        }
      } catch {
        case ex: Exception =>
          println(ex)
          executeFailed(s"Exception when refresh access token: ${ex.getMessage}")
      }
    }
  }

  def executeFailed(msg: String): Unit = {
    currentRetry = currentRetry + 1
    notifyRefreshTokenFailed(msg)
    Thread.sleep(sleepTimeWhenFailed)
    if (currentRetry > maxRetries) {
      notifyRefreshTokenFailed("Stop retry")
      stopSafe()
    }
  }

  def stopSafe(): Unit = isRunning.set(false)

  def notifyRefreshTokenFailed(msg: String): Unit

  def doRefreshToken(): Option[AccessToken]

  override def start(): Unit = {
    isRunning.set(true)
    super.start()
  }

  def setSleepTime(time: Int): Unit = this.sleepTimeInSecond = time
}

case class BasicHttpClient(debug: Boolean = false, connTimeoutMs: Int = 5000, readTimeoutMs: Int = 10000) extends HttpClient {
  override def makeHttpRequest(path: String, headers: Map[String, String] = Map()): HttpRequest = {
    val _headers = Map(
      "Content-Type" -> "application/json;charset=utf-8"
    ) ++ headers

    Http(path).timeout(connTimeoutMs = connTimeoutMs, readTimeoutMs = readTimeoutMs).headers(_headers)
  }

  override def isDebug: Boolean = debug
}