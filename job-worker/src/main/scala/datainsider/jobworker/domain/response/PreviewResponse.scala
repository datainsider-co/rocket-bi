package datainsider.jobworker.domain.response

import datainsider.client.domain.schema.TableSchema
import datainsider.jobworker.client.JdbcClient.Record

case class PreviewResponse(tableSchema: TableSchema, records: Seq[Record])
