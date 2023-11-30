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
 * Create job progress factory by job
 */
trait JobProgressFactoryResolver {

  /**
   * create a reader by job and source. source & job must be not null,
   * if not found factory for job, return none
   */
  def resolve[J <: Job](job: J): Option[JobProgressFactory[J]]
}

private case class JobProgressFactoryResolverImpl private (factoryAsMap: Map[(Class[_]), JobProgressFactory[_]])
    extends JobProgressFactoryResolver {

  /**
    * resolve reader by sync info
    */
  override def resolve[J <: Job](job: J): Option[JobProgressFactory[J]] = {
    factoryAsMap.get((job.getClass)).asInstanceOf[Option[JobProgressFactory[J]]]
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
