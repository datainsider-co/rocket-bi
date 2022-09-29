import { EventStepResult, SubEventExplorerData, SubEventStepValue } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import { EventExplorerConnector, TConnection } from '@/screens/cdp/components/event-explorer-result/EventExplorerConnector';
import { EventHeightCalculator } from '@/screens/cdp/components/event-explorer-result/EventHeightCalculator';
import { EventCalculator } from '@/screens/cdp/components/event-explorer-result/event-calcultor/EventCalculator';
import { Log } from '@core/utils';

export class BeforeEventCalculator extends EventCalculator {
  constructor(public getHeight: (percent: number) => number) {
    super();
  }

  calculateOtherToNextStep(fromSubStep: SubEventExplorerData, toEvent: SubEventStepValue, heightCalculator: EventHeightCalculator) {
    const remainingFromSize = this.getHeight(fromSubStep.other?.percent ?? 0);
    const remainingToSize = this.getHeight(toEvent.value.percent) - heightCalculator.getToHeight(toEvent.eventName);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromSubStep.orderId,
        to: toEvent.id,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromSubStep.orderId),
          offsetYTo: heightCalculator.getToHeight(toEvent.eventName)
        }
      };
      heightCalculator.addFromHeight(fromSubStep.orderId, remainingSize);
      heightCalculator.addToHeight(toEvent.eventName, remainingSize);
      return connection;
    } else {
      return void 0;
    }
  }

  calculateStepToStep(fromEvent: SubEventStepValue, toEvent: SubEventStepValue, heightCalculator: EventHeightCalculator): TConnection | undefined {
    const remainingFromSize = this.getHeight(fromEvent.value.percent);
    const remainingToSize = this.getHeight(toEvent.value.percent) - heightCalculator.getToHeight(toEvent.eventName);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromEvent.id,
        to: toEvent.id,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromEvent.eventName),
          offsetYTo: heightCalculator.getToHeight(toEvent.eventName)
        }
      };

      heightCalculator.addFromHeight(fromEvent.eventName, remainingSize);
      heightCalculator.addToHeight(toEvent.eventName, remainingSize);

      return connection;
    } else {
      return void 0;
    }
  }

  calculateEventToOther(fromEventValue: SubEventStepValue, toSubStep: SubEventExplorerData, heightCalculator: EventHeightCalculator): TConnection | undefined {
    const remainingFromSize = this.getHeight(fromEventValue.value.percent) - heightCalculator.getFromHeight(fromEventValue.eventName);
    const remainingToSize = this.getHeight(toSubStep.other?.percent ?? 0) - heightCalculator.getToHeight(toSubStep.orderId);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromEventValue.id,
        to: toSubStep.orderId,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromEventValue.eventName),
          offsetYTo: heightCalculator.getToHeight(toSubStep.orderId)
        }
      };
      heightCalculator.addFromHeight(fromEventValue.eventName, remainingSize);
      heightCalculator.addToHeight(toSubStep.orderId, remainingSize);
      return connection;
    } else {
      return void 0;
    }
  }

  calculateOtherToOther(fromStep: SubEventExplorerData, toStep: SubEventExplorerData, heightCalculator: EventHeightCalculator): TConnection | undefined {
    const remainingFromSize = this.getHeight(fromStep.other?.percent ?? 0) - heightCalculator.getFromHeight(fromStep.orderId);
    const remainingToSize = this.getHeight(toStep.other?.percent ?? 0) - heightCalculator.getToHeight(toStep.orderId);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromStep.orderId,
        to: toStep.orderId,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromStep.orderId),
          offsetYTo: heightCalculator.getToHeight(toStep.orderId)
        }
      };
      heightCalculator.addFromHeight(fromStep.orderId, remainingSize);
      heightCalculator.addToHeight(toStep.orderId, remainingSize);
      return connection;
    } else {
      return void 0;
    }
  }
}
