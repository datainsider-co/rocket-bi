import { describe, expect, it } from 'vitest';
import { chartHintOf } from './chartHint.utils';

describe('chartHintOf', () => {
  it("gives a type's name, steps and illustration", () => {
    expect(chartHintOf('pie')).toEqual({
      name: 'Pie Chart',
      texts: ['- Drag the Legend properties you want to display on the Pie Chart.', '- Drag the values corresponding to the Legend properties.'],
      image: 'hint-pie.svg'
    });
  });

  it.each(['', 'no_such_chart', 'toString', 'constructor'])('has none for "%s"', chartType => {
    expect(chartHintOf(chartType)).toBeUndefined();
  });
});
