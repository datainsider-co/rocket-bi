import { expect } from 'chai';
import { StringUtils } from '@/utils/StringUtils';
import { RouterUtils } from '@/utils/RouterUtils';

describe('Normalize Name', () => {
  it('should normalize to with -', () => {
    const key = 'chua_join_domain';
    const result = StringUtils.toCamelCase(key);
    expect(result).eq('chuaJoinDomain');
  });

  it('should normalize to with space and dot', () => {
    const key = 'chua Join.domain';
    const result = StringUtils.toCamelCase(key);
    expect(result).eq('chuaJoinDomain');
  });

  it('should normalize to with tieng viet', () => {
    const key = 'Bản Quyền';
    const result = StringUtils.toCamelCase(key);
    expect(result).eq('bảnQuyền');
    expect(key).eq('Bản Quyền');
  });
  it('Router test with name = Thien Vi, id = 123', () => {
    const result = RouterUtils.buildParamPath(123, 'Thien Vi');
    expect(result).eq('thien-vi-123');
  });

  it('Router test with name = undefined, id = 123', () => {
    const result = RouterUtils.buildParamPath(123, void 0);
    expect(result).eq('-123');
  });

  it('Router test with name = "Thiện Vi", id = 0', () => {
    const result = RouterUtils.buildParamPath(123, 'Thiện Vi');
    expect(result).eq('thien-vi-123');
  });
});

describe('Check Email Format', () => {
  it('should check email `abc@gmail.com`', () => {
    const result = StringUtils.isEmailFormat('abc@gmail.com');
    expect(result).eq(true);
  });

  it('should check email `abc@xyz@gmail.com`', () => {
    const result = StringUtils.isEmailFormat('abc@xyz@gmail.com');
    expect(result).eq(false);
  });

  it('should check email `abc@.com`', () => {
    const result = StringUtils.isEmailFormat('abc@.com');
    expect(result).eq(false);
  });

  it('should check email `%$#%#%@xxx.com`', () => {
    const result = StringUtils.isEmailFormat('%$#%#%@xxx.com');
    expect(result).eq(true);
  });

  it('should check email `abc`', () => {
    const result = StringUtils.isEmailFormat('abc');
    expect(result).eq(false);
  });

  it('should check email `@#$@$#@$abc`', () => {
    const result = StringUtils.isEmailFormat('@#$@$#@$abc');
    expect(result).eq(false);
  });

  it('should check email `@#$@$#@$abc.`', () => {
    const result = StringUtils.isEmailFormat('@#$@$#@$abc.');
    expect(result).eq(false);
  });

  it('should check email `abc@!!!.com`', () => {
    const result = StringUtils.isEmailFormat('@#$@$#@$abc.');
    expect(result).eq(false);
  });

  it('should check email `abc@!$&.com`', () => {
    const result = StringUtils.isEmailFormat('@#$@$#@$abc.');
    expect(result).eq(false);
  });

  it('should check email `abc@aaa.&#$$*`', () => {
    const result = StringUtils.isEmailFormat('@#$@$#@$abc.');
    expect(result).eq(false);
  });
});
