import { ExploreEventResponse, FunnelAnalysisResponse, InitEventExplorerResponse } from '@core/cdp/domain/event/EventExploreResponse';
import { Inject } from 'typescript-ioc';
import { EventRepository, ExploreType } from '@core/cdp/repository/EventRepository';
import { ExploreDirection, ExploreEventRequest, FunnelAnalysisRequest, InitEventExplorerRequest } from '@core/cdp';
import { Field } from '@core/common/domain';

export abstract class EventExplorerService {
  abstract list(exploreType: ExploreType): Promise<string[]>;

  abstract init(request: InitEventExplorerRequest): Promise<InitEventExplorerResponse>;

  abstract explore(request: ExploreEventRequest): Promise<ExploreEventResponse>;

  abstract getFields(): Promise<Map<string, Field>>;

  abstract analyzeFunnel(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse>;
}

export class EventExplorerServiceImpl extends EventExplorerService {
  @Inject
  private repository!: EventRepository;

  explore(request: ExploreEventRequest): Promise<ExploreEventResponse> {
    return this.repository.explore(request).then(response => {
      if (request.direction == ExploreDirection.Before) {
        response.layers = response.layers.reverse();
        return response;
      } else {
        return response;
      }
    });
  }

  init(request: InitEventExplorerRequest): Promise<InitEventExplorerResponse> {
    return this.repository.init(request).then(response => {
      response.layersBefore = response.layersBefore.reverse();
      return response;
    });
  }

  list(exploreType: ExploreType): Promise<string[]> {
    return this.repository.list(exploreType);
  }

  getFields(): Promise<Map<string, Field>> {
    return this.repository.getFields();
  }

  analyzeFunnel(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse> {
    return this.repository.analyzeFunnel(request);
  }
}
