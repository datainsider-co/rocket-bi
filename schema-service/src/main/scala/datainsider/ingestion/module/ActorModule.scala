package datainsider.ingestion.module

import akka.actor.{ActorRef, ActorSystem, Props}
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.util.ZConfig

@deprecated("no longer use")
object ActorModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()
  }

  @Provides
  @Singleton
  def providesActorSystem(): ActorSystem = {
    ActorSystem(ZConfig.getString("actor.system_name", "ingestion-service"))
  }

}
