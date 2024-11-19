package co.datainsider.bi.engine

/**
 * created 2023-12-13 6:12 PM
 * @author tvc12 - Thien Vi
 */
trait ClosingNotifier {

  private var handler: () => Unit = () => ()
  protected def notifyClose(): Unit = {
    if (handler != null) {
      handler()
    }
  }

  def setCloseListener(handler: () => Unit): Unit = {
    this.handler = handler
  }

  def removeCloseListener(handler: () => Unit): Unit = {
    this.handler = () => ()
  }
}
