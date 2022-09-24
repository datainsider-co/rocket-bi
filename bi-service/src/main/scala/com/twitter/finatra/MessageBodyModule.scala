package com.twitter.finatra

import co.datainsider.bi.module.CustomResponseWriterImpl
import com.twitter.finatra.http.internal.marshalling.DefaultMessageBodyReaderImpl
import com.twitter.finatra.http.marshalling.{DefaultMessageBodyReader, DefaultMessageBodyWriter}
import com.twitter.inject.{InjectorModule, TwitterModule}

object MessageBodyModule extends TwitterModule {

  flag("http.response.charset.enabled", true, "Return HTTP Response Content-Type UTF-8 Charset")

  override val modules = Seq(InjectorModule)

  protected override def configure(): Unit = {
    bindSingleton[DefaultMessageBodyReader].to[DefaultMessageBodyReaderImpl]
    bindSingleton[DefaultMessageBodyWriter].to[CustomResponseWriterImpl]
  }

}
