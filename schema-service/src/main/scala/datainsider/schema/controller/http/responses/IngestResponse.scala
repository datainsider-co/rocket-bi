package datainsider.schema.controller.http.responses

case class IngestResponse(
    totalRecords: Long,
    totalInvalidRecords: Long,
    totalInvalidFields: Long,
    totalSkippedRecords: Long,
    totalInsertedRecords: Long,
    totalFailedRecords: Long
) {
  def +=(that: IngestResponse): IngestResponse = {
    IngestResponse(
      this.totalRecords + that.totalRecords,
      this.totalInvalidRecords + that.totalInvalidRecords,
      this.totalInvalidFields + that.totalInvalidFields,
      this.totalSkippedRecords + that.totalSkippedRecords,
      this.totalInsertedRecords + that.totalInsertedRecords,
      this.totalFailedRecords + that.totalFailedRecords
    )
  }
}
