package co.datainsider.schema.service

import co.datainsider.schema.domain.requests.CreateDBRequest
import co.datainsider.schema.repository.SchemaRepository
import com.twitter.util.Future
import co.datainsider.common.client.exception.DbExistError

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
    repository.isDatabaseExists(request.getOrganizationId(), dbSchema.name, useDDLQuery = true).map {
      case true => throw DbExistError(s"The database already existed for this organization.")
      case _    =>
    }
  }
}
