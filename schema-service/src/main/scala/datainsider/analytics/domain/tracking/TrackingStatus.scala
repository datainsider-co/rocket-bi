package datainsider.analytics.domain.tracking

case class TrackingStatus(
    instanceName: String,
    runningThreads: String,
    numWorkers: Int,
    currentPoolSize: Int,
    maxPoolSize: Int
)
