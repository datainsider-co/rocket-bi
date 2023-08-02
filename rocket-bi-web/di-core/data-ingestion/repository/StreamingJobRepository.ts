import { BaseClient } from '@core/common/services/HttpClient';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { JobId, ListingRequest } from '@core/common/domain';
import { CreateStreamingJobRequest, KafkaConfig, KafkaStreamingJob, ListingResponse, PreviewResponse, StreamingStatusResponse } from '@core/data-ingestion';
import { StreamingJobResponse } from '@core/data-ingestion/domain/response/streaming-job/StreamingJobResponse';
import { KafkaTopic } from '@core/data-ingestion/domain/response/streaming-job/KafkaTopic';

export abstract class StreamingJobRepository {
  abstract create(request: CreateStreamingJobRequest): Promise<KafkaStreamingJob>;

  abstract list(request: ListingRequest): Promise<ListingResponse<StreamingJobResponse>>;

  abstract delete(id: JobId): Promise<boolean>;

  abstract update(id: JobId, name: string): Promise<boolean>;

  abstract listTopic(kafkaConfig: KafkaConfig): Promise<KafkaTopic[]>;

  abstract preview(config: KafkaConfig): Promise<PreviewResponse>;

  abstract getInfo(id: number): Promise<StreamingStatusResponse>;
}

export class StreamingJobRepositoryImpl extends StreamingJobRepository {
  @InjectValue(DIKeys.RelayClient)
  private readonly httpClient!: BaseClient;

  create(request: CreateStreamingJobRequest): Promise<KafkaStreamingJob> {
    return this.httpClient.post<KafkaStreamingJob>(`relay/streaming_job`, request, void 0).then(job => KafkaStreamingJob.fromObject(job));
  }

  list(request: ListingRequest): Promise<ListingResponse<StreamingJobResponse>> {
    const params = {
      from: request.from,
      size: request.size,
      keyword: request.keyword,
      sorts: request.sorts
    };
    return this.httpClient
      .get<ListingResponse<StreamingJobResponse>>(`relay/streaming_job/list`, params, void 0)
      .then(response => new ListingResponse<StreamingJobResponse>(this.parseToListJob(response.data), response.total));
  }

  delete(jobId: JobId): Promise<boolean> {
    return this.httpClient.delete<boolean>(`relay/streaming_job/${jobId}`, void 0, void 0);
  }

  update(id: JobId, name: string): Promise<boolean> {
    return this.httpClient.put<boolean>(`relay/streaming_job/${id}`, { name: name }, void 0);
  }

  private parseToListJob(listObjects: any[]): StreamingJobResponse[] {
    return listObjects.map(obj => StreamingJobResponse.fromObject(obj));
  }

  listTopic(kafkaConfig: KafkaConfig): Promise<KafkaTopic[]> {
    return this.httpClient.post<KafkaTopic[]>(`relay/streaming_job/topics`, { config: kafkaConfig });
  }

  preview(kafkaConfig: KafkaConfig): Promise<PreviewResponse> {
    return this.httpClient.post<PreviewResponse>(`relay/streaming_job/preview`, { config: kafkaConfig });
  }

  getInfo(id: number): Promise<StreamingStatusResponse> {
    return this.httpClient.get<StreamingStatusResponse>(`relay/streaming_job/${id}/status`).then(res => StreamingStatusResponse.fromObject(res));
  }
}
