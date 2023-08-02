package co.datainsider.schema.domain

import datainsider.client.util.StringUtils

object SchemaUtils {

  /**
    * normalize table name & table column of table schema
    * @param schema schema to be normalized
    * @return
    */
  def normalizeSchema(schema: TableSchema): TableSchema = {
    val normalizedTblName = StringUtils.normalizeString(schema.name)
    val normalizedColumns =
      schema.columns.map(c => {
        val colName: String = StringUtils.normalizeString(c.name)
        c.copyTo(name = colName, displayName = colName)
      })
    schema.copy(name = normalizedTblName, columns = normalizedColumns)
  }

}
