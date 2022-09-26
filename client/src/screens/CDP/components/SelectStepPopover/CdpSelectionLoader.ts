import { IdGenerator } from '@/utils/id_generator';
import { CohortInfo, CohortService, EventExplorerService, ExploreType } from '@core/CDP';
import { StringUtils } from '@/utils/string.utils';

export abstract class CdpSelectionLoader<T> {
  abstract isInit(): boolean;

  /**
   * @throws [DIException] when error
   */
  abstract init(): Promise<void>;

  abstract getDisplayName(value: T): string;

  abstract getId(value: T): any;

  abstract getData(): T[];
}

export class CdpEventLoader implements CdpSelectionLoader<string> {
  private _isInit = false;
  private data: string[] = [];

  private readonly eventService: EventExplorerService;
  private readonly exploreType: ExploreType;

  constructor(eventService: EventExplorerService, exploreType: ExploreType) {
    this.eventService = eventService;
    this.exploreType = exploreType;
  }

  getData(): string[] {
    return this.data.sort(StringUtils.compare);
  }

  isInit(): boolean {
    return this._isInit;
  }

  getDisplayName(value: string): string {
    return value ?? '--';
  }

  getId(value: string): any {
    return IdGenerator.generateKey(['event', value]);
  }

  /**
   * @throws [DIException] when error
   */
  async init(): Promise<void> {
    this.data = await this.eventService.list(this.exploreType);
    this._isInit = true;
  }
}

export class CdpCohortLoader implements CdpSelectionLoader<CohortInfo> {
  private _isInit: boolean;
  private data: CohortInfo[];
  private readonly cohortService: CohortService;

  private getFrom(): number {
    return this.data.length;
  }

  private getSize(): number {
    return 500;
  }

  constructor(cohortService: CohortService) {
    this.cohortService = cohortService;
    this.data = [];
    this._isInit = false;
  }

  getData(): CohortInfo[] {
    return this.data.sort((a, b) => StringUtils.compare(a.name, b.name));
  }

  getDisplayName(value: CohortInfo): string {
    return value.name || 'noname';
  }

  getId(value: CohortInfo): any {
    return IdGenerator.generateKey(['cohort', value.id as any]);
  }

  async init(): Promise<void> {
    const response = await this.cohortService.getListCohortFilter(this.getFrom(), this.getSize());
    this.data = response.data;
    this._isInit = true;
  }

  isInit(): boolean {
    return this._isInit;
  }
}
