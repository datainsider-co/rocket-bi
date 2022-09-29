import { JsonUtils, Log } from '@core/utils';
import { expect } from 'chai';
import { TableColumn } from '@core/common/domain/model';

describe('Json Utils', () => {
  let json = '';
  it('should object to json', () => {
    const settings = {
      function: {
        className: 'table_chart_setting'
      },
      isHorizontalView: true,
      isCollapse: false,
      name: 'conMeo'
    };
    json = JsonUtils.toJson(settings);
    expect(json != null);
    Log.debug(json);
  });

  it('should get object from json as object', () => {
    const settings = JsonUtils.fromObject<TableColumn>(json);
    Log.debug('settings::', settings);
    expect(settings != null);
    expect(settings.function.className).eq('table_chart_setting');
    expect(settings.isCollapse).eq(false);
    expect(settings.isHorizontalView).eq(true);
    expect(settings.name).eq('conMeo');
  });

  it('should get object from json object', () => {
    const newJson = JSON.parse(json);
    const settings = JsonUtils.fromObject<TableColumn>(json);
    Log.debug('settings::', settings);
    expect(settings != null);
    expect(settings.function.className).eq('table_chart_setting');
    expect(settings.isCollapse).eq(false);
    expect(settings.isHorizontalView).eq(true);
    expect(settings.name).eq('conMeo');
  });
});
