/*
 * @author: tvc12 - Thien Vi
 * @created: 4/5/22, 1:29 PM
 */

import { EventExplorerResult, EventStepResult, SubEventExplorerData, SubEventStepValue } from '@/screens/CDP/components/ManagePathExplorer/PathExplorer.entity';
import { AfterEventCalculator } from '@/screens/CDP/components/EventExplorerResult/EventCalcultor/AfterEventCalculator';
import { EventCalculator } from '@/screens/CDP/components/EventExplorerResult/EventCalcultor';
import { EventHeightCalculator } from '@/screens/CDP/components/EventExplorerResult/EventHeightCalculator';
import { BeforeEventCalculator } from '@/screens/CDP/components/EventExplorerResult/EventCalcultor/BeforeEventCalculator';
import { ListUtils } from '@/utils';

export interface TOptions {
  offsetYFrom?: number;
  offsetYTo?: number;
  height?: number;
}

export interface TConnection {
  from: string;
  to: string;
  options?: TOptions;
}

export class EventExplorerConnector {
  private total = 0;

  static readonly HEIGHT = 200;
  static readonly MIN_HEIGHT = 2;

  public buildConnections(result: EventExplorerResult): TConnection[] {
    this.total = result.step.totalValue;
    const connections: TConnection[] = [];
    const beforeConnections: TConnection[] = this.getBeforeConnections(result.step);
    connections.push(...beforeConnections);

    const afterConnections: TConnection[] = this.getAfterConnections(result.step);
    connections.push(...afterConnections);

    return connections;
  }

  private getBeforeConnections(step: EventStepResult): TConnection[] {
    const connections: TConnection[] = [];
    const beforeSteps: SubEventExplorerData[] = step.beforeSteps ?? [];
    if (!step.isLoading) {
      if (ListUtils.isNotEmpty(beforeSteps)) {
        const firstSubStep: SubEventExplorerData = ListUtils.getLast(beforeSteps)!;
        connections.push(...this.getConnectionStepToRoot(step, firstSubStep));
      }
      for (let index = 0; index < beforeSteps.length; index++) {
        const fromSubStep: SubEventExplorerData = beforeSteps[index];
        const toSubStep: SubEventExplorerData = beforeSteps[index + 1];

        // has next step
        if (toSubStep) {
          connections.push(...this.getConnectionBefore2SubStep(fromSubStep, toSubStep));
        }
      }
    }
    return connections;
  }

  private getAfterConnections(step: EventStepResult): TConnection[] {
    const connections: TConnection[] = [];
    if (!step.isLoading) {
      const afterSteps: SubEventExplorerData[] = step.afterSteps ?? [];

      if (ListUtils.isNotEmpty(afterSteps)) {
        const firstSubStep: SubEventExplorerData = ListUtils.getHead(afterSteps)!;
        connections.push(...this.getConnectionRootToStep(step, firstSubStep));
      }

      for (let index = 0; index < afterSteps.length; index++) {
        const fromStep: SubEventExplorerData = afterSteps[index];
        const toStep: SubEventExplorerData = afterSteps[index + 1];
        // has next step
        if (toStep) {
          connections.push(...this.getConnectionAfter2SubStep(fromStep, toStep));
        }
      }
    }
    return connections;
  }

  private uniqueSubEvents(events: SubEventStepValue[]): SubEventStepValue[] {
    const eventEntries: [string, SubEventStepValue][] = events.map(event => [event.eventName, event]);
    return Array.from(new Map(eventEntries).values());
  }

  private getConnectionAfter2SubStep(fromStep: SubEventExplorerData, toStep: SubEventExplorerData): TConnection[] {
    const eventCalculator: EventCalculator = new AfterEventCalculator(this.getHeight);
    const connections: TConnection[] = [];
    if (!fromStep.isLoading && !toStep.isLoading) {
      const sizeCalculator = new EventHeightCalculator();
      const uniqueFromEvents: SubEventStepValue[] = SubEventStepValue.mergeDuplicateEvents(fromStep.events);

      uniqueFromEvents.forEach(fromEvent => {
        const toEvents: SubEventStepValue[] = toStep.events.filter(toEvent => toEvent.from === fromEvent.eventName);
        toEvents.forEach(toEvent => {
          const connection = eventCalculator.calculateStepToStep(fromEvent, toEvent, sizeCalculator);
          if (connection) connections.push(connection);
        });
        const eventToOtherConnection = eventCalculator.calculateEventToOther(fromEvent, toStep, sizeCalculator);
        if (eventToOtherConnection) {
          connections.push(eventToOtherConnection);
        }
      });
      if (fromStep.other) {
        toStep.events.forEach(toEvent => {
          const connection = eventCalculator.calculateOtherToNextStep(fromStep, toEvent, sizeCalculator);
          if (connection) {
            connections.push(connection);
          }
        });

        const otherToOtherConnection = eventCalculator.calculateOtherToOther(fromStep, toStep, sizeCalculator);
        if (otherToOtherConnection) {
          connections.push(otherToOtherConnection);
        }
      }
    }
    return connections;
  }

  /**
   * Step tu -4 -> -3
   */
  private getConnectionBefore2SubStep(fromSubStep: SubEventExplorerData, toSubStep: SubEventExplorerData): TConnection[] {
    const eventCalculator: EventCalculator = new BeforeEventCalculator(this.getHeight);

    const connections: TConnection[] = [];
    if (!fromSubStep.isLoading && !toSubStep.isLoading) {
      const sizeCalculator = new EventHeightCalculator();
      const uniqueToEvents = SubEventStepValue.mergeDuplicateEvents(toSubStep.events);
      fromSubStep.events.forEach(fromEvent => {
        const toEvents: SubEventStepValue[] = uniqueToEvents.filter(toEvent => toEvent.eventName === fromEvent.to);
        toEvents.forEach(toEvent => {
          const connection = eventCalculator.calculateStepToStep(fromEvent, toEvent, sizeCalculator);
          if (connection) {
            connections.push(connection);
          }
        });
        const eventToOtherConnection = eventCalculator.calculateEventToOther(fromEvent, toSubStep, sizeCalculator);
        if (eventToOtherConnection) {
          connections.push(eventToOtherConnection);
        }
      });
      if (fromSubStep.other) {
        uniqueToEvents.forEach(toEvent => {
          const connection = eventCalculator.calculateOtherToNextStep(fromSubStep, toEvent, sizeCalculator);
          if (connection) {
            connections.push(connection);
          }
        });

        const otherToOtherConnection = eventCalculator.calculateOtherToOther(fromSubStep, toSubStep, sizeCalculator);
        if (otherToOtherConnection) {
          connections.push(otherToOtherConnection);
        }
      }
    }
    return connections;
  }

  private getConnectionRootToStep(step: EventStepResult, subStep: SubEventExplorerData): TConnection[] {
    const connections: TConnection[] = [];
    let offsetYFrom = 0;
    subStep.events.forEach(event => {
      const connection: TConnection = {
        from: step.id,
        to: event.id,
        options: {
          height: this.getHeight(event.value.percent),
          offsetYFrom: offsetYFrom
        }
      };
      offsetYFrom += this.getHeight(event.value.percent);
      connections.push(connection);
    });

    if (subStep.other) {
      const stepToOther: TConnection = {
        from: step.id,
        to: subStep.orderId,
        options: {
          height: this.getHeight(subStep.other.percent),
          offsetYFrom: offsetYFrom
        }
      };
      offsetYFrom += this.getHeight(subStep.other.percent);
      connections.push(stepToOther);
    }

    return connections;
  }

  private getConnectionStepToRoot(step: EventStepResult, subStep: SubEventExplorerData): TConnection[] {
    const connections: TConnection[] = [];
    let offsetYTo = 0;
    subStep.events.forEach(event => {
      const connection: TConnection = {
        from: event.id,
        to: step.id,
        options: {
          height: this.getHeight(event.value.percent),
          offsetYTo: offsetYTo
        }
      };
      offsetYTo += this.getHeight(event.value.percent);
      connections.push(connection);
    });

    if (subStep.other) {
      const stepToOther: TConnection = {
        from: subStep.orderId,
        to: step.id,
        options: {
          height: this.getHeight(subStep.other.percent),
          offsetYTo: offsetYTo
        }
      };
      offsetYTo += this.getHeight(subStep.other.percent);
      connections.push(stepToOther);
    }

    return connections;
  }

  getHeight(percent: number) {
    return Math.max(EventExplorerConnector.MIN_HEIGHT, (EventExplorerConnector.HEIGHT * percent) / 100);
  }
}
