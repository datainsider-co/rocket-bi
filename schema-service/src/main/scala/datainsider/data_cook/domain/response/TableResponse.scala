package datainsider.data_cook.domain.response

import com.fasterxml.jackson.databind.JsonNode

/**
  * @author tvc12 - Thien Vi
  * @created 09/24/2021 - 11:52 AM
  */

/**
  * Table response cho client preview etl job
  * @param headers là Array[Object] với index là thứ tự cột, Object là data của cột
  * @param records là Array[Object] với index là thứ tự row, Object là data của từng cột
  */
case class TableResponse(headers: JsonNode, records: JsonNode, total: Long)
