import { expect } from 'chai';
import { JsonUtils } from '@core/utils/JsonUtils';

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
  });

  it('should get object from json as object', () => {
    const settings: any = JsonUtils.fromObject(json);
    expect(settings != null);
    expect(settings.function.className).eq('table_chart_setting');
    expect(settings.isCollapse).eq(false);
    expect(settings.isHorizontalView).eq(true);
    expect(settings.name).eq('conMeo');
  });

  it('should get object from json object', () => {
    const newJson = JSON.parse(json);
    const settings: any = JsonUtils.fromObject(newJson);
    expect(settings != null);
    expect(settings.function.className).eq('table_chart_setting');
    expect(settings.isCollapse).eq(false);
    expect(settings.isHorizontalView).eq(true);
    expect(settings.name).eq('conMeo');
  });
});
