package co.datainsider.bi.engine

/**
 * created 2023-06-27 11:42 AM
 * @author tvc12 - Thien Vi
 */
trait Client extends AutoCloseable {
  def close(): Unit
}
