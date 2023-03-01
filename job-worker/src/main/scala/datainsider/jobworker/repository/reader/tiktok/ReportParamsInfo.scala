package datainsider.jobworker.repository.reader.tiktok

import datainsider.client.domain.schema.column.Column

case class ReportParamsInfo(
    serviceType: String,
    reportType: String,
    dataLevel: String,
    dimensions: Seq[String],
    metricColumns: Seq[Column]
)
