package co.datainsider.bi.engine.factory

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import datainsider.client.exception.NotFoundError

import scala.collection.mutable

/**
  * Resolve engine for each data source type
  *
  * created 2023-05-24 11:51 AM
  *
  * @author tvc12 - Thien Vi
  */
trait EngineResolver {

  /**
    * register engine factory for each data source type
    * @param engine the implementation of engine factory
    * @tparam T type of data source
    * @return this
    */
  def register[T <: Connection](engine: Engine[T])(implicit manifest: Manifest[T]): EngineResolver

  /**
    * get engine factory for each data source type
    * @param clazz class of data source
    * @tparam T type of data source
    * @return the engine factory
    */
  @throws[NotFoundError]("if cannot find engine for data source type")
  def resolve[T <: Connection](clazz: Class[T]): Engine[T]

}

final class EngineResolverImpl() extends EngineResolver {
  private val engineFactoryMap = mutable.Map.empty[Class[_], Engine[_]]

  override def register[T <: Connection](engineFactory: Engine[T])(implicit manifest: Manifest[T]): EngineResolver = {
    engineFactoryMap.put(manifest.runtimeClass, engineFactory.asInstanceOf[Engine[_]])
    this
  }

  override def resolve[T <: Connection](clazz: Class[T]): Engine[T] = {
    val factory: Option[Engine[T]] = engineFactoryMap.get(clazz).map(_.asInstanceOf[Engine[T]])
    if (factory.isDefined) {
      factory.get
    } else {
      throw new NotFoundError(s"Cannot find engine factory for ${clazz.getSimpleName}")
    }
  }
}
