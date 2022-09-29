/* eslint-disable @typescript-eslint/no-use-before-define */

import { ListUtils } from '@/utils';
import { Log } from '@core/utils';

export class InitEventExplorerResponse {
  level: number;
  step: EventNode;
  sequences: EventSequence[];
  layersBefore: EventLayer[];
  layersAfter: EventLayer[];
  total: number;

  constructor(level: number, step: EventNode, sequences: EventSequence[], layersBefore: EventLayer[], layersAfter: EventLayer[], total: number) {
    this.level = level;
    this.step = step;
    this.sequences = sequences;
    this.layersBefore = layersBefore;
    this.layersAfter = layersAfter;
    this.total = total;
  }

  static fromObject(obj: any): InitEventExplorerResponse {
    const sequences: EventSequence[] = obj.sequences.map((obj: any) => EventSequence.fromObject(obj));
    const layersBefore: EventLayer[] = obj.layersBefore.map((obj: any) => EventLayer.fromObject(obj));
    const layersAfter: EventLayer[] = obj.layersAfter.map((obj: any) => EventLayer.fromObject(obj));
    return new InitEventExplorerResponse(obj.level, EventNode.fromObject(obj.step), sequences, layersBefore, layersAfter, obj.total);
  }
}

export class EventNode {
  name: string;
  value: number;
  percent: number;
  fromEvent: string;
  toEvent: string;

  constructor(name: string, value: number, percent: number, fromEvent: string, toEvent: string) {
    this.name = name;
    this.value = value;
    this.percent = percent;
    this.fromEvent = fromEvent;
    this.toEvent = toEvent;
  }

  static fromObject(obj: any): EventNode {
    return new EventNode(obj.name, obj.value, obj.percent, obj.fromEvent, obj.toEvent);
  }
}

export class EventSequence {
  sequence: string[];

  constructor(sequence: string[]) {
    this.sequence = sequence;
  }

  static fromObject(obj: EventSequence & object): EventSequence {
    return new EventSequence(obj.sequence);
  }

  static default() {
    return new EventSequence([]);
  }
}

export class ExploreEventResponse {
  layers: EventLayer[];

  constructor(layers: EventLayer[]) {
    this.layers = layers;
  }

  static fromObject(obj: any) {
    const layers: EventLayer[] = obj.layers.map((layer: any) => EventLayer.fromObject(layer));
    return new ExploreEventResponse(layers);
  }
}

export class EventLayer {
  level: number;
  nodes: EventNode[];
  other?: EventNode | null;
  dropOff?: EventNode | null;
  sequences: EventSequence[];

  constructor(level: number, nodes: EventNode[], sequences: EventSequence[], other?: EventNode | null, dropOff?: EventNode | null) {
    this.level = level;
    this.nodes = nodes;
    this.sequences = sequences;
    this.other = other;
    this.dropOff = dropOff;
  }

  static fromObject(obj: EventLayer & object): EventLayer {
    const nodes: EventNode[] = obj.nodes.map(node => EventNode.fromObject(node));
    const sequences: EventSequence[] = obj.sequences.map(sequence => EventSequence.fromObject(sequence));
    const other: EventNode | null = obj.other ? EventNode.fromObject(obj.other) : null;
    const dropOff: EventNode | null = obj.dropOff ? EventNode.fromObject(obj.dropOff) : null;
    return new EventLayer(obj.level, nodes, sequences, other, dropOff);
  }
}

export class EventDetail {
  name: string;
  value: number;
  eventSequence: EventSequence;

  constructor(name: string, value: number, eventSequence: EventSequence) {
    this.name = name;
    this.value = value;
    this.eventSequence = eventSequence;
  }

  static fromObject(obj: any): EventDetail {
    const eventSequence = EventSequence.fromObject(obj.eventSequence);
    return new EventDetail(obj.name, obj.value, eventSequence);
  }

  static default(): EventDetail {
    return new EventDetail('', 0, EventSequence.default());
  }
}

export class FunnelAnalysisResponse {
  events: EventDetail[];

  constructor(events: EventDetail[]) {
    this.events = events;
  }

  getTotal(): number {
    return ListUtils.getHead(this.events)?.value ?? 0;
  }

  static fromObject(obj: any): FunnelAnalysisResponse {
    const events: EventDetail[] = obj.events.map((event: any) => EventDetail.fromObject(event));
    return new FunnelAnalysisResponse(events);
  }

  static default() {
    return new FunnelAnalysisResponse([EventDetail.default()]);
  }
}
