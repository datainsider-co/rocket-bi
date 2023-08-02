package co.datainsider.schema.domain.responses

case class TableExpressionsResponse(dbName: String, tblName: String, expressions: Map[String, String])
