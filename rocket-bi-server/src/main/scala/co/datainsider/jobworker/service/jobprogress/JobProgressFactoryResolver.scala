package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.exception.{CreateJobProgressException, CreateReaderException}

import scala.collection.mutable

/**
  * created 2022-09-12 4:57 PM
  *
  * @author tvc12 - Thien Vi
  */

/**
 * Class ho tro tao ra reader tuong ung voi tung loai datasource va job
 */
trait JobProgressFactoryResolver {

  /**
   * create a reader by job and source. source & job must be not null
   *
   * neu job khong co source, co the truyen vao MockDataSource.
   *
   * throw CreateReaderException neu khong the tao reader
   */
  @throws[CreateJobProgressException]("if can not create factory")
  def resolve[J <: Job](job: J): JobProgressFactory[J]
}

private case class JobProgressFactoryResolverImpl private (factoryAsMap: Map[(Class[_]), JobProgressFactory[_]])
    extends JobProgressFactoryResolver {

  /**
    * resolve reader by sync info
    */
  override def resolve[J <: Job](job: J): JobProgressFactory[J] = {
    val factory: Option[JobProgressFactory[J]] = factoryAsMap.get((job.getClass)).asInstanceOf[Option[JobProgressFactory[J]]]
    factory match {
      case Some(factory) => factory
      case None =>
        throw CreateReaderException(s"Can not resolve job progress factory for ${job.getClass.getSimpleName}")
    }
  }
}

object JobProgressFactoryResolver {
  def builder(): JobProgressResolverBuilder = new JobProgressResolverBuilder()
}

class JobProgressResolverBuilder {
  private val factoryAsMap: mutable.Map[Class[_], JobProgressFactory[_]] = mutable.Map.empty

  def add[J <: Job](jobCls: Class[J], factory: JobProgressFactory[J]): JobProgressResolverBuilder = {
    factoryAsMap.put(jobCls, factory)
    this
  }

  def build(): JobProgressFactoryResolver = JobProgressFactoryResolverImpl(factoryAsMap.toMap)
}
