package datainsider.data_cook.pipeline

import datainsider.data_cook.pipeline.exception.UnsupportedExecutorException
import datainsider.data_cook.pipeline.operator.{Executor, Operator}

import scala.collection.mutable
import scala.reflect.ClassTag

trait ExecutorResolver {

  def register[T <: Operator](executor: Executor[T])(implicit manifest: Manifest[T]): ExecutorResolver

  def register[T <: Operator](cls: Class[T], executor: Executor[_]): ExecutorResolver

  /**
    * get executor by operator class
    * @throws UnsupportedExecutorException when cannot resolve executor
    */
  @throws[UnsupportedExecutorException]
  def getExecutor[T <: Operator](operator: T): Executor[T]
}

class ExecutorResolverImpl extends ExecutorResolver {
  private val mapExecutors = new mutable.HashMap[Class[_], Executor[_]]()

  override def register[T <: Operator](executor: Executor[T])(implicit manifest: Manifest[T]): ExecutorResolver = {
    val operatorClass: Class[_] = manifest.runtimeClass
    mapExecutors.put(operatorClass, executor)
    this
  }

  override def register[T <: Operator](cls: Class[T], executor: Executor[_]): ExecutorResolver = {
    mapExecutors.put(cls, executor)
    this
  }

  @throws[UnsupportedExecutorException]
  override def getExecutor[T <: Operator](operator: T): Executor[T] = {
    mapExecutors.get(operator.getClass) match {
      case Some(executor) => executor.asInstanceOf[Executor[T]]
      case _              => throw UnsupportedExecutorException(s"unsupported executor for ${operator.getClass.getSimpleName}")
    }
  }

}
