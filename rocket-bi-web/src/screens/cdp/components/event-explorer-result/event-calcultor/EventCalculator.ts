import { EventStepResult, SubEventExplorerData, SubEventStepValue } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import { EventExplorerConnector, TConnection } from '@/screens/cdp/components/event-explorer-result/EventExplorerConnector';
import { EventHeightCalculator } from '@/screens/cdp/components/event-explorer-result/EventHeightCalculator';

export abstract class EventCalculator {
  abstract calculateStepToStep(fromEvent: SubEventStepValue, toEvent: SubEventStepValue, heightCalculator: EventHeightCalculator): TConnection | undefined;

  abstract calculateEventToOther(
    fromEvent: SubEventStepValue,
    toSubStep: SubEventExplorerData,
    heightCalculator: EventHeightCalculator
  ): TConnection | undefined;

  abstract calculateOtherToOther(
    fromSubStep: SubEventExplorerData,
    toSubStep: SubEventExplorerData,
    heightCalculator: EventHeightCalculator
  ): TConnection | undefined;

  abstract calculateOtherToNextStep(
    fromSubStep: SubEventExplorerData,
    toEvent: SubEventStepValue,
    heightCalculator: EventHeightCalculator
  ): TConnection | undefined;
}
