package co.datainsider.bi.domain

/**
  * hold values of variables that sql query can substitute into itself dynamically at runtime.
  *
  * @param variables string-string map of key-value pair
  */
case class QueryContext(variables: Map[String, String] = Map.empty)
