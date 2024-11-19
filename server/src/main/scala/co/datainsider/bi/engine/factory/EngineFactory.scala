package co.datainsider.bi.engine.factory

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.{Client, Engine}

/**
 * created 2023-12-13 4:59 PM
 *
 * @author tvc12 - Thien Vi
 */
trait EngineFactory[T <: Connection] {
  @throws[CreateEngineException]("if cannot create engine")
  def create(connection: T): Engine

  @throws[CreateEngineException]("if cannot create engine")
  def createTestEngine(connection: T): Engine
}
