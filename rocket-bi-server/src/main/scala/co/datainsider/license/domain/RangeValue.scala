package co.datainsider.license.domain

case class RangeValue[T](min: T, max: T) {
  def isInRange(value: Comparable[T]): Boolean = value.compareTo(min) > -1 && value.compareTo(max) < 1
}
