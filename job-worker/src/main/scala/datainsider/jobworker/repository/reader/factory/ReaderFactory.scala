package datainsider.jobworker.repository.reader.factory
import datainsider.jobworker.domain.{DataSource, Job}
import datainsider.jobworker.exception.CreateReaderException
import datainsider.jobworker.repository.reader.Reader

/**
  * Class nay dung de tao ra reader tuong ung voi tung loai datasource & job
  * @tparam S: Kieu du lieu cua datasource
  * @tparam J: Kieu du lieu cua job
  */
trait ReaderFactory[S <: DataSource, J <: Job] {

  /**
    * create a reader by job and source. source & job must be not null
    *
    * neu job khong co source, co the truyen vao MockDataSource.
    *
    * throw CreateReaderException neu khong the tao reader
    */
  @throws[CreateReaderException]("if can not create reader")
  def create(source: S, job: J): Reader
}
