import { EtlJobInfo, EtlOperator } from '@core/data-cook';
import differenceWith from 'lodash/differenceWith';
import uniqBy from 'lodash/uniqBy';

export class OperatorHandler {
  private readonly value: EtlJobInfo;

  constructor(value: EtlJobInfo) {
    this.value = value;
  }

  get leavesOperators(): EtlOperator[] {
    if (this.value) {
      return this.value.operators;
    } else {
      return [];
    }
  }

  set leavesOperators(value: EtlOperator[]) {
    if (this.value) {
      this.value.operators = value;
    }
  }

  get getDataItems(): EtlOperator[] {
    return this.allOperators.filter(operator => operator.isGetData);
  }

  get notGetDataItems(): EtlOperator[] {
    return this.allOperators.filter(operator => !operator.isGetData);
  }

  get allOperators(): EtlOperator[] {
    const operators = this.leavesOperators.flatMap(operator => operator.getAllOperators());
    return EtlOperator.unique(operators);
  }

  addNewOperator(newOperator: EtlOperator, parentName: string) {
    const leafIndex: number = this.leavesOperators.findIndex(operator => operator.destTableName === parentName);
    const newOperators = this.leavesOperators.concat([]);
    if (leafIndex >= 0) {
      newOperators[leafIndex] = newOperator;
    } else {
      newOperators.push(newOperator);
    }

    this.leavesOperators = newOperators;
  }

  private compactOperators(leavesOperators: EtlOperator[]): EtlOperator[] {
    return leavesOperators.filter((leafOperator: EtlOperator) => {
      const otherLeafOperators: EtlOperator[] = leavesOperators.filter(operator => operator.destTableName !== leafOperator.destTableName);
      const isSubOperator: boolean = otherLeafOperators.some((otherLeafOperator: EtlOperator) =>
        otherLeafOperator.isIncludeOperator(leafOperator.destTableName)
      );
      return !isSubOperator;
    });
  }

  clearAll() {
    this.leavesOperators = [];
  }

  remove(deletedOperator: EtlOperator, onRemoved: (operator: EtlOperator) => void): void {
    const operators: EtlOperator[] = [];
    this.leavesOperators.forEach((leafOperator, _) => {
      const [deathOperators, aliveOperators] = this.browseDeathAndAliveNodes(leafOperator, deletedOperator);
      deathOperators.forEach(onRemoved);
      operators.push(...aliveOperators);
    });
    this.leavesOperators = this.compactOperators(operators);
  }

  /**
   * find death nodes and alive nodes from leaf node and deleted node
   *
   */
  private browseDeathAndAliveNodes(root: EtlOperator, deletedNode: EtlOperator): [EtlOperator[], EtlOperator[]] {
    const stack: EtlOperator[] = [];
    let alive: EtlOperator[] = [];
    let death: EtlOperator[] = [];
    let current: EtlOperator | undefined = root;
    while (current) {
      const parentOperators: EtlOperator[] = current.getParentOperators();
      const nextOperators: EtlOperator[] = differenceWith(parentOperators, alive.concat(death), (a, b) => a.destTableName === b.destTableName);
      if (current.destTableName === deletedNode.destTableName) {
        death.push(...stack, deletedNode);
        alive.push(...nextOperators);
        current = stack.pop();
        // break;
      } else if (nextOperators[0]) {
        stack.push(current);
        current = nextOperators[0];
      } else {
        if (!death.some(item => item.destTableName === current?.destTableName)) {
          alive = differenceWith(alive, parentOperators, (a, b) => a.destTableName === b.destTableName).filter(
            item => item.destTableName !== deletedNode.destTableName
          );
          alive.push(current);
        }
        current = stack.pop();
      }
    }
    death = uniqBy(death, item => item.destTableName);
    return [death, alive];
  }
}
