import { expect } from 'chai';
import { MinMaxCondition } from '@core/domain';
import { ChartUtils } from '@/utils';

describe('is show data label value with condition', () => {
  it(`should return value: 10000 with condition 0 <= value <=10`, () => {
    const value = 10000;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 1 with condition 0 <= value <=10`, () => {
    const value = 1;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 0 with condition 0 <= value <=10`, () => {
    const value = 0;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 10 with condition 0 <= value <=10`, () => {
    const value = 10;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: -1 with condition 0 <= value <=10`, () => {
    const value = -1;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: -1 with condition value <=10`, () => {
    const value = -1;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: true, equal: true },
      min: { value: 0, enabled: false, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: -1 with condition value >=0`, () => {
    const value = -1;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: false, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 0 with condition value >=0`, () => {
    const value = 0;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: false, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 0 with condition value >0`, () => {
    const value = 0;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: false, equal: true },
      min: { value: 0, enabled: true, equal: false },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 2,000,000,000,000 with condition value >0`, () => {
    const value = 2000000000000;
    const condition: MinMaxCondition = {
      max: { value: 10, enabled: false, equal: true },
      min: { value: 0, enabled: true, equal: false },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 2,000,000,000,000 with condition 0 <= value < 2,000,000,000,000`, () => {
    const value = 2000000000000;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000, enabled: true, equal: false },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 2,000,000,000,000 with condition 0 <= value <= 2,000,000,000,000`, () => {
    const value = 2000000000000;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 2,000,000,000,000.0001 with condition 0 <= value <= 2,000,000,000,000`, () => {
    const value = 2000000000000.0001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 2,000,000,000,000.0001 with condition 0 <= value <= 2,000,000,000,000`, () => {
    const value = 2000000000000.0001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 2,000,000,000,000.0001 with condition 0 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 2000000000000.0001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 0.0001 with condition 0 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.0001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 0.0001 with condition 0.0001 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.0001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0.0001, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 0.0001 with condition 0 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.00000000000001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0.0001, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 0.00000000000001 with condition 0.0001 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.00000000000001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0.0001, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(false);
  });

  it(`should return value: 0.0000000001 with condition 0.0000000001 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.0000000001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0.0000000001, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });

  it(`should return value: 0.000000001 with condition 0.0000000001 <= value <= 2,000,000,000,000.0001`, () => {
    const value = 0.000000001;
    const condition: MinMaxCondition = {
      max: { value: 2000000000000.0001, enabled: true, equal: true },
      min: { value: 0.0000000001, enabled: true, equal: true },
      enabled: true
    };
    const result = ChartUtils.isShowValue(value, condition);
    expect(result).eq(true);
  });
});
