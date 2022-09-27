package com.twitter.finatra
import com.twitter.finatra.http.internal.marshalling.DefaultMessageBodyReaderImpl
import com.twitter.finatra.http.marshalling.{DefaultMessageBodyReader, DefaultMessageBodyWriter}
import com.twitter.inject.{InjectorModule, TwitterModule}
import datainsider.schema.module.CustomResponseWriterImpl

object MessageBodyModule extends TwitterModule {

  flag("http.response.charset.enabled", true, "Return HTTP Response Content-Type UTF-8 Charset")

  override val modules = Seq(InjectorModule)

  protected override def configure(): Unit = {
    bindSingleton[DefaultMessageBodyReader].to[DefaultMessageBodyReaderImpl]
    bindSingleton[DefaultMessageBodyWriter].to[CustomResponseWriterImpl]
  }

}
