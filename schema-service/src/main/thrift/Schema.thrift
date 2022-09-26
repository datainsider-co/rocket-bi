#@namespace scala datainsider.ingestion.service
include "SchemaDT.thrift"

service TSchemaService {
    # schema api
    string getDatabases(i64 organizationId)

    string getDatabaseSchema(i64 organizationId, string dbName)

    string getTableSchema(i64 organizationId, string dbName, string tblName)

    string getAnalyticsDatabaseSchema(i64 organizationId)

    string getAnalyticsUserProfileSchema(i64 organizationId)

    string getAnalyticsEventSchema(i64 organizationId)

    SchemaDT.TEventDetailSchemaResult getAnalyticsEventDetailSchema(i64 organizationId, string event)

    SchemaDT.TEventDetailSchemaMapResult multiGetAnalyticsEventDetailSchema(i64 organizationId, list<string> events)

    void createOrMergeTableSchema(string schema)

    void ensureDatabaseCreated(i64 organizationId, string name, optional string displayName)

    bool renameTableSchema(i64 organizationId, string dbName, string tblName, string newTblName)

    bool deleteTableSchema(i64 organizationId, string dbName, string tblName)

    string getTemporaryTables(i64 organizationId, string dbName)

    string mergeSchemaByProperties(i64 organizationId, string dbName, string tblName, string propertiesAsJson)

    # file upload api
    string verify(1: i64 syncId,2: string fileName)

    bool recordHistory(1: i64 historyId, 2: string fileName, 3: i64 fileSize, 4: bool isSuccess, 5: string message)

    # tracking api
    string getApiKey(string apiKey)

    string mergeEventDetailSchema(i64 organizationId, string event, string propertiesAsJson)

    # table expressions

    string getExpressions(1: string dbName, 2: string tblName)
}
