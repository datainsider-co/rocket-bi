package datainsider.analytics.domain

object MetricCategory {
  val ACTIVE_USER = "active_users"
}

object UserCollectionFields {
  val DATE = "date"
  val CATEGORY = "category"
  val USER_ID = "user_id"
  val TOTAL_ACTION = "total_action"
  val TIME_MS = "time_ms"
  val INSERTED_TIME = "inserted_time_ms"
}

object ActiveUserFields {
  val DATE = "date"
  val CATEGORY = "category"
  val A1 = "a1"
  val TOTAL_A1 = "total_a1"
  val A7 = "a7"
  val TOTAL_A7 = "total_a7"
  val A14 = "a14"
  val TOTAL_A14 = "total_a14"
  val A30 = "a30"
  val TOTAL_A30 = "total_a30"
  val An = "an"
  val A0 = "a0"
  val TIME_MS = "time_ms"
  val INSERTED_TIME = "inserted_time_ms"
}

case class ActiveUserMetric(
    a1: Long,
    totalA1: Long,
    a7: Long,
    totalA7: Long,
    a14: Long,
    totalA14: Long,
    a30: Long,
    totalA30: Long,
    an: Long,
    a0: Long
)

case class UserActionMetricData(userId: String, totalAction: Long)
