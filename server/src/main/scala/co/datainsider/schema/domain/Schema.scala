package co.datainsider.schema.domain

import co.datainsider.bi.domain.query.TableView
import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.schema.domain.TableStatus.TableStatus
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column.Column
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.inject.Logging
import co.datainsider.schema.domain.column.NestedColumn
import co.datainsider.common.client.exception.TableNotFoundError
import co.datainsider.common.client.util.JsonParser
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

object DatabaseSchema {

  implicit class DatabaseLike(val databaseSchema: DatabaseSchema) extends AnyVal {

    def toDatabaseInfo(): DatabaseShortInfo = {
      DatabaseShortInfo(
        name = databaseSchema.name,
        organizationId = databaseSchema.organizationId,
        creatorId = databaseSchema.creatorId,
        displayName = databaseSchema.name, // TODO: for updateDisplayNames in SchemaController
        createdTime = databaseSchema.createdTime,
        updatedTime = databaseSchema.updatedTime
      )
    }
  }

  implicit class DatabaseSchemaLike(val databaseInfo: DatabaseShortInfo) extends AnyVal {

    def toDatabaseSchema(): DatabaseSchema = {
      DatabaseSchema(
        name = databaseInfo.name,
        organizationId = databaseInfo.organizationId,
        displayName = databaseInfo.displayName,
        createdTime = 0,
        updatedTime = 0,
        tables = Seq.empty
      )
    }

  }

  implicit class DatabaseSeqLike(val databaseSchemas: Seq[DatabaseSchema]) extends AnyVal {
    def asDatabaseShortInfos(): Seq[DatabaseShortInfo] = {
      databaseSchemas.map(_.toDatabaseInfo())
    }
  }

}

object TableSchema {

  implicit object TableSchemaSerializer extends Serializer[TableSchema] with Logging {
    override def fromByte(bytes: Array[Byte]): TableSchema = {
      SerializationUtils.deserialize(bytes).asInstanceOf[TableSchema]
    }

    override def toByte(value: TableSchema): Array[Byte] = {
      SerializationUtils.serialize(value.asInstanceOf[Serializable])
    }
  }

  implicit class ImplicitTableSchema(val tableSchema: TableSchema) extends AnyVal {
    def copyAsMergeMultipleColumns(columns: Seq[Column]): TableSchema = {

      columns.foldLeft(tableSchema)((tableSchema, column) => {
        val newColumn = tableSchema.findColumn(column.name).fold(column)(_.mergeWith(column))
        tableSchema.copyAsMergeColumn(newColumn)
      })
    }
  }

  /**
    * temporary table will not be shown to users
    * temporary table has pattern: __di_[table_name]_[created_timestamp]
    */
  def buildTemporaryTblName(name: String): String = {
    s"__di_${name}_${System.currentTimeMillis()}"
  }

  /**
    * mark table will not be shown to users, can removable
    * mark table has pattern: __di_old_[table_name]_[created_timestamp]
    */
  def buildOldTblName(name: String): String = {
    s"__di_old_${name}_${System.currentTimeMillis()}"
  }
}

@SerialVersionUID(20200715L)
case class DatabaseShortInfo(
    name: String,
    organizationId: Long,
    creatorId: String,
    displayName: String,
    createdTime: Long,
    updatedTime: Long
)

class TableTypeRef extends TypeReference[TableType.type]
object TableType extends Enumeration {
  type TableType = Value

  val View: TableType = Value("view")
  val Materialized: TableType = Value("materialized")
  val Default: TableType = Value("default")
  val InMemory: TableType = Value("in_memory")
  // serve for etl view, only create etl on one node, high performance
  val EtlView: TableType = Value("etl_view")
  // table with logic replace data when two row same sort key value
  val Replacing: TableType = Value("replacing")
}

@SerialVersionUID(20200715)
case class TableSchema(
    name: String,
    dbName: String,
    organizationId: Long,
    displayName: String,
    columns: Seq[Column],
    engine: Option[String] = None,
    primaryKeys: Seq[String] = Seq.empty,
    partitionBy: Seq[String] = Seq.empty,
    orderBys: Seq[String] = Seq.empty,
    query: Option[String] = None,
    @JsonScalaEnumeration(classOf[TableTypeRef]) tableType: Option[TableType] = None,
    @JsonScalaEnumeration(classOf[TableStatusRef]) tableStatus: Option[TableStatus] = None,
    ttl: Option[Long] = None,
    expressionColumns: Seq[Column] = Seq.empty,
    calculatedColumns: Seq[Column] = Seq.empty
) extends Serializable {

  /** *
    * temporary table will not be shown to users
    * temporary table has pattern: __di_<table_name>_<created_timestamp>
    */
  def isTemporary: Boolean = {
    val tmpTableRegex = """^__di_([\w]+)_(\d{13})$""".r
    name match {
      case tmpTableRegex(_*) => true
      case _                 => false
    }
  }

  def findColumn(columnName: String): Option[Column] = {
    columns.find(_.name.equals(columnName))
  }

  def getNestedColumnChanged(columns: Seq[Column]): Seq[NestedColumn] = {
    val oldColumnMap = this.columns.map(column => column.name -> column).toMap

    columns
      .filter(_.isInstanceOf[NestedColumn])
      .map(_.asInstanceOf[NestedColumn])
      .map(c => (c, oldColumnMap.get(c.name)))
      .filter(_._2.isDefined)
      .map(entry => entry._1 -> entry._2.get)
      .filter(entry => entry._2.isInstanceOf[NestedColumn])
      .map(entry => entry._1 -> entry._2.asInstanceOf[NestedColumn])
      .map {
        case (newColumns, oldColumn) =>
          val oldChildNameSet = oldColumn.nestedColumns.map(_.name).toSet
          val newChildColumns = newColumns.nestedColumns.filterNot(x => oldChildNameSet.contains(x.name))
          oldColumn.copy(
            nestedColumns = oldColumn.nestedColumns ++ newChildColumns
          )
      }
      .filterNot(_.nestedColumns.isEmpty)
  }

  /**
    * Check table create from query
    * @return true if query existed, false otherwise
    */
  @JsonIgnore
  def isFromQuery(): Boolean = query.isDefined

  /**
    * Get table type as enum,
    * other wise
    * @return
    * if query existed & tableType is None => normal view
    * if query existed & tableType is existed => value of tableType
    * default return Default
    */
  def getTableType: TableType = {
    if (isFromQuery()) {
      tableType.getOrElse(TableType.View)
    } else {
      tableType.getOrElse(TableType.Default)
    }
  }

  /**
    * Add or replace with this new column
    * @param newColumn
    * @return a new Schema with new column added
    */
  def copyAsMergeColumn(newColumn: Column): TableSchema = {
    val index = columns.indexWhere(column => column.name == newColumn.name)
    if (index >= 0) {
      this.copy(
        columns = this.columns.zipWithIndex.map {
          case (column, i) =>
            if (i == index)
              newColumn
            else
              column
        }
      )
    } else {
      this.copy(
        columns = this.columns ++ Seq(newColumn)
      )
    }
  }

  def defaultShardTblName: String = name + "_shard"

  @JsonIgnore
  def getColumnNames: Seq[String] = {
    columns.map(_.name)
  }
}

@SerialVersionUID(20200715L)
case class DatabaseSchema(
    name: String,
    organizationId: Long,
    displayName: String,
    creatorId: String = "",
    createdTime: Long = 0,
    updatedTime: Long = 0,
    tables: Seq[TableSchema] = Seq.empty
) {

  @throws[TableNotFoundError]
  def findTable(tblName: String): TableSchema = {
    findTableAsOption(tblName) match {
      case Some(tableSchema) => tableSchema
      case _                 => throw TableNotFoundError(s"the table $tblName was not found in ${displayName} database")
    }
  }

  def findTables(tableNames: Array[String]): Array[TableSchema] = {
    val setTableNames: Set[String] = tableNames.toSet
    tables.filter(table => setTableNames.contains(table.name)).toArray
  }

  def findTableAsOption(tblName: String): Option[TableSchema] = {
    tables
      .find(_.name.equals(tblName))
      .map(tblSchema => {
        // This function is for back-compatible with old version. This function converts null values of newly added fields to default values of TableSchema class.
        val tableSchemaAsJson: String = JsonParser.toJson(tblSchema)
        JsonParser.fromJson[TableSchema](tableSchemaAsJson)
      })
  }

  def removeTemporaryTable(): DatabaseSchema = {
    copy(tables = tables.filter(!_.isTemporary))
  }

  def addTable(newTableSchema: TableSchema): DatabaseSchema = {
    val dbSchema: DatabaseSchema = this.remove(newTableSchema.name)
    dbSchema.copy(
      tables = dbSchema.tables ++ Seq(newTableSchema)
    )
  }

  def remove(tblName: String): DatabaseSchema = {
    val newTables: Seq[TableSchema] = tables.filterNot(_.name.trim == tblName.trim)
    this.copy(
      tables = newTables
    )
  }
}

class TableStatusRef extends TypeReference[TableStatus.type]
object TableStatus extends Enumeration {
  type TableStatus = Value
  val Normal: TableStatus = Value("Normal")
  val Processing: TableStatus = Value("Processing")
}
