import { EventStepResult, SubEventExplorerData, SubEventStepValue } from '@/screens/CDP/components/ManagePathExplorer/PathExplorer.entity';
import { EventExplorerConnector, TConnection } from '@/screens/CDP/components/EventExplorerResult/EventExplorerConnector';
import { EventHeightCalculator } from '@/screens/CDP/components/EventExplorerResult/EventHeightCalculator';

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
