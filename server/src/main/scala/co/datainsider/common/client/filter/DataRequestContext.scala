package co.datainsider.common.client.filter

import com.twitter.finagle.http.Request

/**
  * @author anhlt
  */
object DataRequestContext {
  private val dataRequest = Request.Schema.newField[Any]()

  def setDataRequest(request: Request, requestParam: Any): Unit = {
    request.ctx.update(dataRequest, requestParam)
  }

  implicit class MainRequestContextSyntax(val request: Request) extends AnyVal {
    def requestData[T]: T = request.ctx(dataRequest).asInstanceOf[T]
  }

}
