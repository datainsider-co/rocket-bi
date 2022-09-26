#@namespace scala datainsider.ingestion.domain.thrift

struct TEventDetailSchemaResult{
    1:required i32 code
    2:optional string schema
}

struct TEventDetailSchemaMapResult{
    1:required i32 code
    2:optional map<string,string> schemes
}
