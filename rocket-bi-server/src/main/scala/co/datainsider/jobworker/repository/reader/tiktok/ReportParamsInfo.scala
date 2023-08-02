package co.datainsider.jobworker.repository.reader.tiktok

import co.datainsider.schema.domain.column.Column

case class ReportParamsInfo(
    serviceType: String,
    reportType: String,
    dataLevel: String,
    dimensions: Seq[String],
    metricColumns: Seq[Column]
)
