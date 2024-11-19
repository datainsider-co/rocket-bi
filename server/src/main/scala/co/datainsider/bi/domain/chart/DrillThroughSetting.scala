package co.datainsider.bi.domain.chart

import co.datainsider.bi.domain.query.Field

/**
  * Trait for drill through feature, all widget that support drill through should implement this trait. Class allow drill from a field to other dashboard by that field
  * created 2022-12-26 2:19 PM
  *
  * @author tvc12 - Thien Vi
  */
trait DrillThroughSetting {
  /**
   * Get fields can be used for drill through, if field match field from client request. It will be used for drill through
   * @return
   */
  def getDrillThroughFields(): Seq[Field]
}
