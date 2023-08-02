package co.datainsider.jobworker.client.palexy

import com.fasterxml.jackson.databind.JsonNode

case class PalexyResponse(
    totalElements: Int,
    rows: Array[JsonNode]
)
