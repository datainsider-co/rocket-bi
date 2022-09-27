package datainsider.schema.controller.http.responses

case class TableExpressionsResponse(dbName: String, tblName: String, expressions: Map[String, String])
