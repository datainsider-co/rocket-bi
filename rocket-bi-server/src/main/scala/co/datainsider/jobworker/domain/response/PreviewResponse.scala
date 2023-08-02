package co.datainsider.jobworker.domain.response

import co.datainsider.schema.domain.TableSchema
import co.datainsider.bi.client.JdbcClient.Record

case class PreviewResponse(tableSchema: TableSchema, records: Seq[Record])
