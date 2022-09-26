package datainsider.ingestion.service

import com.twitter.util.Future
import datainsider.client.exception.DbExistError
import datainsider.ingestion.controller.http.requests.CreateDBRequest
import datainsider.ingestion.repository.SchemaRepository

/**
  * @author andy
  * @since 7/15/20
  */
trait Validator[T] {
  def validate(data: T): Future[Unit]
}

case class CreateDBValidator(repository: SchemaRepository) extends Validator[CreateDBRequest] {

  override def validate(request: CreateDBRequest): Future[Unit] = {
    val dbSchema = request.buildDatabaseSchema()
    repository.existsDatabaseSchema(dbSchema.name).map {
      case true => throw DbExistError(s"The database already existed for this organization.")
      case _    =>
    }
  }
}
