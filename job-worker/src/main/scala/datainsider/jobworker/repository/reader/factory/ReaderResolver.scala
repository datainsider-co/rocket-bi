package datainsider.jobworker.repository.reader.factory

import datainsider.jobworker.domain.{DataSource, Job}
import datainsider.jobworker.exception.CreateReaderException
import datainsider.jobworker.repository.reader.Reader

import scala.collection.mutable

/**
  * created 2022-09-12 4:57 PM
  *
  * @author tvc12 - Thien Vi
  */

/**
 * Class ho tro tao ra reader tuong ung voi tung loai datasource va job
 */
trait ReaderResolver {

  /**
   * create a reader by job and source. source & job must be not null
   *
   * neu job khong co source, co the truyen vao MockDataSource.
   *
   * throw CreateReaderException neu khong the tao reader
   */
  @throws[CreateReaderException]("if can not create reader")
  def resolve[S <: DataSource, J <: Job](source: S, job: J): Reader
}

case class ReaderResolverImpl private (factoryAsMap: Map[(Class[_], Class[_]), ReaderFactory[_, _]])
    extends ReaderResolver {

  /**
    * resolve reader by sync info
    */
  override def resolve[S <: DataSource, J <: Job](source: S, job: J): Reader = {
    val factory: Option[ReaderFactory[S, J]] = factoryAsMap.get((source.getClass, job.getClass)).asInstanceOf[Option[ReaderFactory[S, J]]]
    factory match {
      case Some(factory) => factory.create(source, job)
      case None =>
        throw CreateReaderException(
          s"Can not create reader for ${job.getClass.getSimpleName} and source ${source.getClass.getSimpleName}"
        )
    }
  }
}

object ReaderResolver {
  def builder(): ReaderResolverBuilder = new ReaderResolverBuilder()
}

class ReaderResolverBuilder {
  private val factoryAsMap: mutable.Map[(Class[_], Class[_]), ReaderFactory[_, _]] = mutable.Map.empty

  def add[S <: DataSource, J <: Job](sourceCls: Class[S], jobCls: Class[J], factory: ReaderFactory[S, J]): ReaderResolverBuilder = {
    factoryAsMap.put((sourceCls, jobCls), factory)
    this
  }

  def build(): ReaderResolver = ReaderResolverImpl(factoryAsMap.toMap)
}
