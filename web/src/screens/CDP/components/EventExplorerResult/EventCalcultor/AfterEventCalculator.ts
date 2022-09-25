import { EventStepResult, SubEventExplorerData, SubEventStepValue } from '@/screens/CDP/components/ManagePathExplorer/PathExplorer.entity';
import { EventExplorerConnector, TConnection } from '@/screens/CDP/components/EventExplorerResult/EventExplorerConnector';
import { EventHeightCalculator } from '@/screens/CDP/components/EventExplorerResult/EventHeightCalculator';
import { EventCalculator } from '@/screens/CDP/components/EventExplorerResult/EventCalcultor/EventCalculator';

export class AfterEventCalculator extends EventCalculator {
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
    const remainingFromSize = this.getHeight(fromEvent.value.percent) - heightCalculator.getFromHeight(fromEvent.eventName);
    const remainingToSize = this.getHeight(toEvent.value.percent);
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

  calculateEventToOther(fromEvent: SubEventStepValue, toSubEvent: SubEventExplorerData, heightCalculator: EventHeightCalculator): TConnection | undefined {
    const remainingFromSize = this.getHeight(fromEvent.value.percent) - heightCalculator.getFromHeight(fromEvent.eventName);
    const remainingToSize = this.getHeight(toSubEvent.other?.percent ?? 0) - heightCalculator.getToHeight(toSubEvent.orderId);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromEvent.id,
        to: toSubEvent.orderId,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromEvent.eventName),
          offsetYTo: heightCalculator.getToHeight(toSubEvent.orderId)
        }
      };
      heightCalculator.addFromHeight(fromEvent.eventName, remainingSize);
      heightCalculator.addToHeight(toSubEvent.orderId, remainingSize);
      return connection;
    } else {
      return void 0;
    }
  }

  calculateOtherToOther(fromSubStep: SubEventExplorerData, toSubStep: SubEventExplorerData, heightCalculator: EventHeightCalculator): TConnection | undefined {
    const remainingFromSize = this.getHeight(fromSubStep.other?.percent ?? 0) - heightCalculator.getFromHeight(fromSubStep.orderId);
    const remainingToSize = this.getHeight(toSubStep.other?.percent ?? 0) - heightCalculator.getToHeight(toSubStep.orderId);
    const remainingSize = Math.min(remainingFromSize, remainingToSize);

    if (remainingSize > EventExplorerConnector.MIN_HEIGHT) {
      const connection = {
        from: fromSubStep.orderId,
        to: toSubStep.orderId,
        options: {
          height: remainingSize,
          offsetYFrom: heightCalculator.getFromHeight(fromSubStep.orderId),
          offsetYTo: heightCalculator.getToHeight(toSubStep.orderId)
        }
      };
      heightCalculator.addFromHeight(fromSubStep.orderId, remainingSize);
      heightCalculator.addToHeight(toSubStep.orderId, remainingSize);
      return connection;
    } else {
      return void 0;
    }
  }
}
