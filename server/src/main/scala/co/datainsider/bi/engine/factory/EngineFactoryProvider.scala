package co.datainsider.bi.engine.factory

import co.datainsider.bi.domain.Connection
import co.datainsider.common.client.exception.NotFoundError

import scala.collection.mutable
import scala.reflect.ClassTag

/**
  * Resolve engine for each data source type
  *
  * created 2023-05-24 11:51 AM
  *
  * @author tvc12 - Thien Vi
  */

trait EngineFactoryProvider {

  /**
    * get engine for each connection
    * @param clazz is class of connection
    *                   @return engine
    */
  @throws[NotFoundError]("if cannot find engine factory for connection")
  def get[T <: Connection](clazz: ClassTag[T]): EngineFactory[T]

  /**
    * register engine factory for each data source type
    * @param fn the implementation of engine factory
    * @tparam T type of data source
    * @return this
    */
  def register[T <: Connection](factory: EngineFactory[T])(implicit manifest: Manifest[T]): EngineFactoryProvider
}

object EngineFactoryProvider {
  def apply(): EngineFactoryProvider = new EngineProviderImpl()
}

private final class EngineProviderImpl() extends EngineFactoryProvider {
  private val engineFactoryMap = mutable.Map.empty[Class[_], EngineFactory[_]]

  override def get[T <: Connection](clazz: ClassTag[T]): EngineFactory[T] = {
    engineFactoryMap
      .getOrElse(
        clazz.runtimeClass,
        throw NotFoundError(s"Cannot find engine factory for ${clazz}")
      )
      .asInstanceOf[EngineFactory[T]]
  }

  override def register[T <: Connection](factory: EngineFactory[T])(implicit manifest: Manifest[T]): EngineFactoryProvider = {
    engineFactoryMap.put(manifest.runtimeClass, factory)
    this
  }
}
