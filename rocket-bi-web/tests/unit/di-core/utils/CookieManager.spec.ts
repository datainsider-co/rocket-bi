import { DevModule, Di } from '@core/common/modules';
import { CookieManger } from '@core/common/services';
import { expect } from 'chai';

describe('Test Cookie Manager', () => {
  let cookieManager: CookieManger;
  before(() => {
    Di.init([new DevModule()]);
    cookieManager = Di.get<CookieManger>(CookieManger);
  });

  it('should put data to cookie success', () => {
    cookieManager.putMaxAge('key', 'valueTest');
    cookieManager.putMaxAge('key2', 'valueTest2');
    expect(cookieManager.get('key')).equal('valueTest');
    expect(cookieManager.get('key2')).equal('valueTest2');
  });
  it('should fail get data not have from cookie', () => {
    const value = cookieManager.get('fake_key');
    expect(value).is.undefined;
  });
  it('should remove value in cookie successful', () => {
    cookieManager.putMaxAge('key', 'data_must_be_remove');
    cookieManager.remove('key');
    const value = cookieManager.get('key');
    expect(value).is.undefined;
  });
  it('should clear data in cookie successful', () => {
    cookieManager.putMaxAge('key', 'data_must_be_remove');
    cookieManager.putMaxAge('key1', 'data_must_be_remove');
    cookieManager.putMaxAge('key2', 'data_must_be_remove');
    cookieManager.putMaxAge('key3', 'data_must_be_remove');
    cookieManager.clear();
    expect(cookieManager.get('key')).is.undefined;
    expect(cookieManager.get('key1')).is.undefined;
    expect(cookieManager.get('key')).is.undefined;
  });
});
