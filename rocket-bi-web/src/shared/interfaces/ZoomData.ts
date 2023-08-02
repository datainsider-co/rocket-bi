import { FieldRelatedFunction, ScalarFunctionType } from '@core/common/domain/model';
import { cloneDeep, isEqual } from 'lodash';
export class ZoomData {
  horizontalLevel: FieldRelatedFunction;
  currentHorizontalLevel?: string;

  constructor(horizontalLevel: FieldRelatedFunction) {
    this.horizontalLevel = horizontalLevel;
    this.currentHorizontalLevel = horizontalLevel.scalarFunction?.className;
  }

  setHorizontalLevel(newLevel: string): ZoomData {
    this.currentHorizontalLevel = newLevel;
    return this;
  }

  createNewHorizontalField(nextLvl: string): ZoomData {
    const newScalarFn = cloneDeep(this.horizontalLevel.scalarFunction);
    if (this.currentHorizontalLevel && newScalarFn) {
      newScalarFn.className = nextLvl as ScalarFunctionType;
      this.horizontalLevel.setScalarFunction(newScalarFn);
      this.currentHorizontalLevel = this.horizontalLevel.scalarFunction?.className;
    }
    return this;
  }

  isSameHorizontalLevel(horizontalLevel: FieldRelatedFunction) {
    return isEqual(this.horizontalLevel, horizontalLevel);
  }
}

export class ZoomLevelNode {
  constructor(public level: string, public displayName: string) {}
}
