package co.datainsider.jobworker.repository.reader.factory

import co.datainsider.jobworker.domain.{DataSource, Job}
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.Reader

/**
  * Factory to create reader by source type and job type.
  *
  * Example: Create TikTokAdsReader by TikTokAdsSource & TikTokAdsJob
  *
  * @tparam S: Type of source
  * @tparam J: Type of job
  */
trait ReaderFactory[S <: DataSource, J <: Job] {

  /**
    * create a reader by job and source. source and job must be not null
    *
    * If job does not have source, you can pass in MockDataSource as source
    *
    * throw CreateReaderException if create has error
    */
  @throws[CreateReaderException]("if can not create reader")
  def create(source: S, job: J): Reader
}
