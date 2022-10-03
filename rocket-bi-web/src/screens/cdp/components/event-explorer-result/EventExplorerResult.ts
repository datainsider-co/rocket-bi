import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import {
  PathExplorerInfo,
  EventExplorerResult,
  EventStepResult,
  EventStepValue,
  SubEventExplorerData,
  SubEventStepValue
} from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import DiagramPanel from '@/screens/data-cook/components/diagram-panel/DiagramPanel.vue';
import EventConnection from './diagram-panel-item/EventConnection.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { Inject } from 'typescript-ioc';
import { EventExplorerService } from '@core/cdp/service/EventExploreService';
import { DateRange } from '@/shared';
import { DateUtils, ListUtils } from '@/utils';
import { Log, NumberUtils } from '@core/utils';
import { NumberFormatter } from '@core/common/services';
import { EventExplorerConnector, TConnection } from '@/screens/cdp/components/event-explorer-result/EventExplorerConnector';
import {
  EventLayer,
  EventNode,
  EventSequence,
  ExploreEventRequest,
  ExploreEventResponse,
  InitEventExplorerRequest,
  InitEventExplorerResponse
} from '@core/cdp';
import { IdGenerator } from '@/utils/IdGenerator';
import { groupBy, sum } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { ChartOption } from '@core/common/domain';

const formatter = NumberFormatter.default();

@Component({
  name: 'EventExplorerResult',
  components: {
    DiagramPanel,
    EventConnection,
    PopoverV2
  },
  filters: {
    format(value: number) {
      return formatter.format(value);
    }
  }
})
export default class EventExplorerResultComp extends Vue {
  private readonly connector = new EventExplorerConnector();
  private result: EventExplorerResult | null = null;
  // danh sách sequence tính từ level sang bên trái
  private afterSequences: EventSequence[][] = [];
  // danh sách sequence tính từ root sang phải
  private beforeSequences: EventSequence[][] = [];

  private removalBeforeSteps: SubEventExplorerData[] = [];
  private removalAfterSteps: SubEventExplorerData[] = [];

  private isError = false;
  private errorMsg = '';

  private retryFunction: Function | null = null;

  @Prop({ type: Object, default: () => null })
  private readonly info!: PathExplorerInfo;

  @Prop({ type: Object, required: true })
  private readonly dateRange!: DateRange;

  @Inject
  private readonly eventExplorerService!: EventExplorerService;

  @Ref()
  private readonly diagramPanel?: DiagramPanel;

  @Ref()
  private readonly eventConnections?: EventConnection[];

  private colorAndEventAsMap: Map<string, string> = new Map();

  @Watch('info', { deep: true })
  private onInfoUpdated(info: PathExplorerInfo) {
    this.init(info, this.fromLevel, this.toLevel, this.dateRange);
  }

  @Watch('dateRange', { deep: true })
  private onDateRangeUpdated(dateRange: DateRange) {
    this.init(this.info, this.fromLevel, this.toLevel, dateRange);
  }

  protected get cssVariables(): object {
    return {
      '--eer-height': [EventExplorerConnector.HEIGHT + 80, 'px'].join('')
    };
  }

  private get isEmpty() {
    return !this.result || !this.result.step;
  }

  private get connections(): TConnection[] {
    if (this.result) {
      return this.connector.buildConnections(this.result);
    } else {
      return [];
    }
  }

  // before step, is negative number
  private get fromLevel(): number {
    if (this.result && this.result.step) {
      return -this.result.step.beforeSteps.length;
    } else {
      return 0;
    }
  }

  // after step, is positive number
  private get toLevel(): number {
    if (this.result && this.result.step) {
      return this.result.step.afterSteps.length;
    } else {
      return 0;
    }
  }

  private mergeDuplicateStep(events: SubEventStepValue[]): SubEventStepValue[] {
    return SubEventStepValue.mergeDuplicateEvents(events).sort((event1, event2) => event2.value.percent - event1.value.percent);
  }

  @Watch('connections')
  private onConnectionsChanged() {
    this.$nextTick(() => {
      this.reDrawConnections();
    });
  }

  private reDrawConnections() {
    if (this.diagramPanel) {
      this.diagramPanel.autoResize();
    }
    if (this.eventConnections) {
      this.eventConnections.forEach(connection => connection.reDraw());
    }
  }

  protected getStyleFromPercent(percent: number) {
    const heightInPixel = this.connector.getHeight(percent);
    return {
      height: StringUtils.toPx(heightInPixel)
    };
  }

  protected getColorFromEventName(name: string | null | undefined) {
    const eventName = name ?? '';
    const color = this.colorAndEventAsMap.has(eventName) ? this.colorAndEventAsMap.get(name ?? '') : this.createColor(eventName);
    return {
      backgroundColor: color
    };
  }

  private createColor(name: string): string {
    const color = ListUtils.getElementCycleList(ChartOption.DEFAULT_PALETTE_COLOR, this.colorAndEventAsMap.size);
    this.colorAndEventAsMap.set(name, color);
    return color;
  }

  private async addSubStepBefore(step: EventStepResult, numberSteps: number) {
    const loadingSteps: SubEventExplorerData[] = this.genLoadingSteps(numberSteps);

    try {
      this.isError = false;
      const request = ExploreEventRequest.exploreBefore(
        ListUtils.getHead(this.beforeSequences) || [],
        -step.beforeSteps.length,
        numberSteps,
        DateUtils.toTimestampRange(this.dateRange),
        this.info.getExplorerType(),
        this.info.getExplorerValues(),
        this.info.getCohortIds(),
        this.result?.step.totalValue ?? 0
      );
      Log.info('add::request', request);
      step.beforeSteps.unshift(...loadingSteps);
      const response: ExploreEventResponse = await this.eventExplorerService.explore(request);
      this.beforeSequences.unshift(...this.getSequences(response.layers));
      const subSteps: SubEventExplorerData[] = this.toSubEventExplorers(step.id, response.layers);

      step.beforeSteps = this.removePlaceholderData(step.beforeSteps, loadingSteps);
      // từ trái qua phải, level nhỏ nhất (số âm) phải vị trí 0
      // [-6, -5, -4, -3, -2, -1]
      step.beforeSteps.unshift(...subSteps);
    } catch (ex) {
      Log.error(`addSubStepBefore::error ${ex.message}`, ex);
      this.isError = true;
      this.errorMsg = ex.message || 'can not explorer event at this time!';
      step.beforeSteps = this.removePlaceholderData(step.beforeSteps, loadingSteps);
      this.retryFunction = () => this.addSubStepBefore(step, numberSteps);
    }
  }

  private removePlaceholderData(steps: SubEventExplorerData[], placeholders: SubEventExplorerData[]) {
    const placeholderIds: Set<string> = new Set(placeholders.map(placeholder => placeholder.id));
    return ListUtils.remove(steps, item => placeholderIds.has(item.id));
  }

  private genLoadingSteps(numberSteps: number): SubEventExplorerData[] {
    const placeHolders: SubEventExplorerData[] = [];
    for (let index = 0; index < numberSteps; ++index) {
      placeHolders.push(SubEventExplorerData.default());
    }
    return placeHolders;
  }

  private async addSubStepAfter(step: EventStepResult, numberSteps: number) {
    const loadingSteps: SubEventExplorerData[] = this.genLoadingSteps(numberSteps);

    try {
      this.isError = false;
      const request = ExploreEventRequest.exploreAfter(
        ListUtils.getLast(this.afterSequences) || [],
        step.afterSteps.length,
        numberSteps,
        DateUtils.toTimestampRange(this.dateRange),
        this.info.getExplorerType(),
        this.info.getExplorerValues(),
        this.info.getCohortIds(),
        this.result?.step.totalValue ?? 0
      );
      Log.info('add::request', request);
      step.afterSteps.push(...loadingSteps);
      const response: ExploreEventResponse = await this.eventExplorerService.explore(request);
      this.afterSequences.push(...this.getSequences(response.layers));
      const subSteps: SubEventExplorerData[] = this.toSubEventExplorers(step.id, response.layers);

      step.afterSteps = this.removePlaceholderData(step.afterSteps, loadingSteps);
      step.afterSteps.push(...subSteps);
    } catch (ex) {
      Log.error(`addSubStepAfter::error ${ex.message}`, ex);
      this.isError = true;
      this.errorMsg = ex.message || 'can not explorer event at this time!';
      step.afterSteps = this.removePlaceholderData(step.afterSteps, loadingSteps);
      this.retryFunction = () => this.addSubStepAfter(step, numberSteps);
    }
  }

  private handleMouseWheel(e: WheelEvent) {
    if (e.deltaX !== 0) {
      e.preventDefault();
    }
  }

  private removeBeforeStep(step: EventStepResult) {
    step.beforeSteps = step.beforeSteps.filter(subStep => !this.removalBeforeSteps.includes(subStep));
    const startIndex: number = this.removalBeforeSteps.length;
    // cần remove -5, -4 trong [-5, -4, -3, -2, -1]
    this.beforeSequences = this.beforeSequences.slice(startIndex, this.beforeSequences.length);
    this.removalBeforeSteps = [];
  }

  private setRemovalBeforeStep(step: EventStepResult, subStepIdx: number, isRemoval: boolean) {
    if (!isRemoval) {
      this.removalBeforeSteps = [];
    } else {
      this.removalBeforeSteps = [];
      for (let i = 0; i <= subStepIdx; i++) {
        this.removalBeforeSteps.push(step.beforeSteps[i]);
      }
    }
  }

  private isRemovalBeforeStep(step: EventStepResult, subStepIdx: number) {
    return this.removalBeforeSteps.includes(step.beforeSteps[subStepIdx]);
  }

  private removeAfterStep(step: EventStepResult) {
    step.afterSteps = step.afterSteps.filter(subStep => !this.removalAfterSteps.includes(subStep));
    const removeStep: number = this.removalAfterSteps.length;
    // cần remove 2 step (5 & 6) in list [1, 2, 3, 4, 5, 6]
    // phải slice(0, 4)
    this.afterSequences = this.afterSequences.slice(0, this.afterSequences.length - removeStep);
    this.removalAfterSteps = [];
  }

  private setRemovalAfterStep(step: EventStepResult, subStepIdx: number, isRemoval: boolean) {
    if (!isRemoval) {
      this.removalAfterSteps = [];
    } else {
      this.removalAfterSteps = [];
      for (let i = subStepIdx; i < step.afterSteps.length; i++) {
        this.removalAfterSteps.push(step.afterSteps[i]);
      }
    }
  }

  private isRemovalAfterStep(step: EventStepResult, subStepIdx: number) {
    return this.removalAfterSteps.includes(step.afterSteps[subStepIdx]);
  }

  private async init(explorerInfo: PathExplorerInfo, fromLevel: number, toLevel: number, dateRange: DateRange) {
    try {
      this.isError = false;
      this.colorAndEventAsMap = new Map();
      if (ListUtils.isEmpty(explorerInfo.steps)) {
        this.result = null;
      } else {
        this.showLoading();
        const request = new InitEventExplorerRequest(
          ListUtils.getHead(explorerInfo.steps)!.eventName,
          fromLevel,
          toLevel,
          DateUtils.toTimestampRange(dateRange),
          explorerInfo.getExplorerType(),
          explorerInfo.getExplorerValues(),
          explorerInfo.getCohortIds()
        );
        const response: InitEventExplorerResponse = await this.eventExplorerService.init(request);
        this.afterSequences = [response.sequences, ...this.getSequences(response.layersAfter)];
        this.beforeSequences = [response.sequences, ...this.getSequences(response.layersBefore)];
        this.result = this.toEventExplorerResult(response);
      }
    } catch (ex) {
      Log.error(`init error ${ex}`, ex);
      this.errorMsg = ex.message || 'can not explorer this event at this time!';
      this.isError = true;
      this.retryFunction = () => this.init(explorerInfo, fromLevel, toLevel, dateRange);
    }
  }

  // hàm này sẽ tạo ra hiệu ứng loading
  private showLoading() {
    if (this.result) {
      this.result.step.showLoading(true);
    } else {
      this.result = EventExplorerResult.loading();
    }
  }

  private toEventExplorerResult(response: InitEventExplorerResponse): EventExplorerResult {
    const id = IdGenerator.generateKey([response.step.name, response.level.toString()]);
    const beforeSteps: SubEventExplorerData[] = this.toSubEventExplorers(id, response.layersBefore);
    const afterSteps: SubEventExplorerData[] = this.toSubEventExplorers(id, response.layersAfter);
    return new EventExplorerResult(
      [],
      new EventStepResult(id, response.step.name, EventStepValue.fromResponse(response.step), null, beforeSteps, afterSteps, false, response.total)
    );
  }

  private toSubEventExplorers(previousId: string, layers: EventLayer[]): SubEventExplorerData[] {
    return layers.map((layer, index) => {
      const id = IdGenerator.generateKey([layer.level.toString(), index.toString(), previousId]);
      const events: SubEventStepValue[] = this.mergeDuplicateNodes(layer.nodes).map(node => {
        const id = IdGenerator.generateKey([node.name, layer.level.toString()]);
        return new SubEventStepValue(id, node.name, new EventStepValue(node.value, NumberUtils.percentage(node.percent)), node.fromEvent, node.toEvent);
      });
      const other = layer.other ? new EventStepValue(layer.other.value, NumberUtils.percentage(layer.other.percent)) : null;
      const dropOff = layer.dropOff ? new EventStepValue(layer.dropOff.value, layer.dropOff.percent) : null;
      return new SubEventExplorerData(id, events, other, dropOff, false);
    });
  }

  private mergeDuplicateNodes(nodes: EventNode[]): EventNode[] {
    const newNodes = groupBy(nodes, node => IdGenerator.generateKey([node.name, node.fromEvent || node.toEvent || '']));
    return Object.entries(newNodes).map(([key, values]) => {
      const node: EventNode = ListUtils.getHead(values)!;
      const totalValue = sum(values.map(value => value.value));
      const totalPercentage = sum(values.map(value => value.percent));
      return new EventNode(node.name, totalValue, totalPercentage, node.fromEvent, node.toEvent);
    });
  }

  protected getSequences(layers: EventLayer[]): EventSequence[][] {
    return layers.map(layer => layer.sequences);
  }
}
