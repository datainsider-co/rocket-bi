import { ExploreEventResponse, FunnelAnalysisResponse, InitEventExplorerResponse } from '@core/CDP/Domain/Event/EventExploreResponse';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services';
import { ListingResponse } from '@core/DataIngestion';
import { ExploreEventRequest, FunnelAnalysisRequest, InitEventExplorerRequest } from '@core/CDP';
import { Field } from '@core/domain';

export enum ExploreType {
  Event = 'Event',
  Screen = 'Screen'
}
export abstract class EventRepository {
  abstract init(request: InitEventExplorerRequest): Promise<InitEventExplorerResponse>;

  abstract explore(request: ExploreEventRequest): Promise<ExploreEventResponse>;

  abstract list(exploreType: ExploreType): Promise<string[]>;

  abstract getFields(): Promise<Map<string, Field>>;

  abstract analyzeFunnel(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse>;
}

export class EventRepositoryImpl extends EventRepository {
  @InjectValue(DIKeys.CdpClient)
  private httpClient!: BaseClient;

  init(request: InitEventExplorerRequest): Promise<InitEventExplorerResponse> {
    return this.httpClient.post('cdp/events/init', request).then(response => InitEventExplorerResponse.fromObject(response));
  }

  list(exploreType: ExploreType): Promise<string[]> {
    return this.httpClient
      .post<ListingResponse<string>>(`cdp/events/values`, { exploreType: exploreType })
      .then(response => response.data);
  }

  explore(request: ExploreEventRequest): Promise<ExploreEventResponse> {
    return this.httpClient.post('cdp/events/explore', request).then(response => ExploreEventResponse.fromObject(response));
  }

  getFields(): Promise<Map<string, Field>> {
    return this.httpClient.get(`cdp/events/fields`).then(response => {
      return new Map(Object.entries(response as any).map(([key, value]) => [key, Field.fromObject(value as any)]));
    });
  }

  analyzeFunnel(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse> {
    return this.httpClient.post('cdp/events/funnel', request).then(response => FunnelAnalysisResponse.fromObject(response));
  }
}
