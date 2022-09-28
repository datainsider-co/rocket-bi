import { expect } from 'chai';
import ParamInfo, { RouterUtils } from '@/utils/RouterUtils';

describe('Test parse router', () => {
  it('parse param value: thien-vi-123', () => {
    const paramValue = 'thien-vi-123';
    const info: ParamInfo = RouterUtils.parseToParamInfo(paramValue);
    expect(info.id).eq('123');
    expect(info.idAsNumber()).eq(123);
    expect(info.isIdNumber()).eq(true);
    expect(info.name).eq('thien-vi');
  });

  it('parse param value: thien-vi-dashboard_123', () => {
    const paramValue = 'thien-vi-dashboard_123';
    const info: ParamInfo = RouterUtils.parseToParamInfo(paramValue);
    expect(info.id).eq('dashboard_123');
    expect(info.idAsNumber()).NaN;
    expect(info.isIdNumber()).eq(false);
    expect(info.name).eq('thien-vi');
  });
  it('parse param value: 123', () => {
    const paramValue = '123';
    const info: ParamInfo = RouterUtils.parseToParamInfo(paramValue);
    expect(info.id).eq('123');
    expect(info.idAsNumber()).eq(123);
    expect(info.isIdNumber()).eq(true);
    expect(info.name).eq('');
  });

  it('parse param value: -123', () => {
    const paramValue = '-123';
    const info: ParamInfo = RouterUtils.parseToParamInfo(paramValue);
    expect(info.id).eq('123');
    expect(info.idAsNumber()).eq(123);
    expect(info.isIdNumber()).eq(true);
    expect(info.name).eq('');
  });
});
