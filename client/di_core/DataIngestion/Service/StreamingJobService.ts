import {
  CreateStreamingJobRequest,
  KafkaConfig,
  KafkaStreamingJob,
  ListingResponse,
  PreviewResponse,
  StreamingJobRepository,
  StreamingStatusResponse
} from '@core/DataIngestion';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { JobId } from '@core/domain';
import { Inject } from 'typescript-ioc';
import { StreamingJobResponse } from '@core/DataIngestion/Domain/Response/StreamingJob/StreamingJobResponse';
import { KafkaTopic } from '@core/DataIngestion/Domain/Response/StreamingJob/KafkaTopic';

export abstract class StreamingJobService {
  abstract create(request: CreateStreamingJobRequest): Promise<KafkaStreamingJob>;

  abstract list(request: ListingRequest): Promise<ListingResponse<StreamingJobResponse>>;

  abstract delete(id: JobId): Promise<boolean>;

  abstract update(id: JobId, name: string): Promise<boolean>;

  abstract listTopic(kafkaConfig: KafkaConfig): Promise<KafkaTopic[]>;

  abstract preview(config: KafkaConfig): Promise<PreviewResponse>;

  abstract getInfo(id: number): Promise<StreamingStatusResponse>;
}

export class StreamingJobServiceImpl implements StreamingJobService {
  constructor(@Inject private jobRepository: StreamingJobRepository) {}

  create(request: CreateStreamingJobRequest): Promise<KafkaStreamingJob> {
    return this.jobRepository.create(request);
  }

  delete(id: JobId): Promise<boolean> {
    return this.jobRepository.delete(id);
  }

  list(request: ListingRequest): Promise<ListingResponse<StreamingJobResponse>> {
    return this.jobRepository.list(request);
  }

  update(id: JobId, name: string): Promise<boolean> {
    return this.jobRepository.update(id, name);
  }

  listTopic(kafkaConfig: KafkaConfig): Promise<KafkaTopic[]> {
    return this.jobRepository.listTopic(kafkaConfig);
  }

  preview(kafkaConfig: KafkaConfig): Promise<PreviewResponse> {
    return this.jobRepository.preview(kafkaConfig);
  }

  getInfo(id: number): Promise<StreamingStatusResponse> {
    return this.jobRepository.getInfo(id);
  }
}
