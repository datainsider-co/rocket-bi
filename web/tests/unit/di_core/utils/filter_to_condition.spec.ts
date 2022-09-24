import { DateFilter } from '@core/domain/Model';

describe('filter to condition', () => {
  const commonSetting = { id: 1, name: '', description: '' };
  // it('shoud assign single value for input filter', () => {
  //   const chartId = 2;
  //   const inputValueFilter = new InputValueFilter(commonSetting);
  //   const value = 'Ronaldo';
  //   inputValueFilter.setValue(value);
  //   const condition = inputValueFilter.toCondition(chartId);
  //   expect(condition instanceof Equal).eq(true);
  //   const equal = condition as Equal;
  //   expect(equal.value).eq(value);
  // });

  // it('should assign multiple values for drop down filter', () => {
  //   const chartId = 1;
  //   const dropDownFilter = new DropDownFilter(
  //     commonSetting,
  //     [
  //       new AffectedChart(1, new Like(new Field('db', 'tbl', 'name', 'string'), '')),
  //       new AffectedChart(2, new Equal(new Field('db', 'tbl', 'name', 'string'), ''))
  //     ],
  //     [new DropDownValue('cr7', 'Ronaldo')]
  //   );
  //   const values = ['Ronaldo', 'Messi', 'Neymar'];
  //   dropDownFilter.setValues(values);
  //   const condition = dropDownFilter.toCondition(chartId);
  //   expect(condition instanceof Or).eq(true);
  //   const or = condition as Or;
  //   const likeRonaldo = or.conditions[0] as Like;
  //   const likeMessi = or.conditions[1] as Like;
  //   const likeNeymar = or.conditions[2] as Like;
  //   expect(likeRonaldo instanceof Like);
  //   expect(likeMessi instanceof Like);
  //   expect(likeNeymar instanceof Like);
  //   expect(likeRonaldo.value).eq('Ronaldo');
  //   expect(likeMessi.value).eq('Messi');
  //   expect(likeNeymar.value).eq('Neymar');
  // });

  it('should assign value for date condition', () => {
    const chartId = 1;
    const dateFilter = new DateFilter(commonSetting);
    const date = '2020-02-02';
    dateFilter.setDate(date);
  });

  /** condition utils */

  // it('should return array of conditions', () => {
  //   const chartIds = [1, 2, 3];
  //   const inputValueFilter = new InputValueFilter(commonSetting, [
  //     new AffectedChart(1, new Like(new Field('db', 'tbl', 'name', 'string'), '')),
  //     new AffectedChart(2, new Equal(new Field('db', 'tbl', 'name', 'string'), ''))
  //   ]);
  //   const dropDownFilter = new DropDownFilter(
  //     commonSetting,
  //
  //     [
  //       new AffectedChart(1, new Equal(new Field('db', 'tbl', 'age', 'int'), '')),
  //       new AffectedChart(2, new GreaterThan(new Field('db', 'tbl', 'age', 'int'), ''))
  //     ],
  //     [new DropDownValue('cr7', 'Ronaldo')]
  //   );
  //   const dateFilter = new DateFilter(commonSetting, [
  //     new AffectedChart(3, new Equal(new Field('db', 'tbl', 'dob', 'date'), '')),
  //     new AffectedChart(2, new LessThanOrEqual(new Field('db', 'tbl', 'dob', 'date'), ''))
  //   ]);
  //   const name = 'Ronaldo';
  //   const ages = ['35', '75'];
  //   const dob = '1985-05-02';
  //
  //   inputValueFilter.setValue(name);
  //   dropDownFilter.setValues(ages);
  //   dateFilter.setDate(dob);
  //
  //   const filters = [inputValueFilter, dropDownFilter, dateFilter];
  //   const conditions = ConditionUtils.buildExternalCondition(2, filters);
  //   expect(conditions.length).equal(3);
  // });

  /** MainDateFilter builder */

  // it('should set affected chart to main date filter', () => {
  //   const charts = [
  //     new ChartInfo(
  //       commonSetting,
  //
  //       new ObjectQuery([new Select(new Field('db', 'tbl', 'dob', 'date'))], []),
  //       new TableChartSetting([])
  //     ),
  //     new ChartInfo(commonSetting, new ObjectQuery([new Group(new Field('db', 'tbl', 'created_date', 'date'))], []), new TableChartSetting([]))
  //   ];
  //   const affectedCharts = MainDateFilterUtils.toAffectedCharts(charts);
  //   const mainDateFilter = new RangeDateFilter(commonSetting, [], '2000-01-01 00:00:00', '2010-01-01 00:00:00');
  //   mainDateFilter.setAffectedCharts(affectedCharts);
  //   expect(mainDateFilter.affectedCharts).eq(affectedCharts);
  //   mainDateFilter.setDate('2000-01-01 00:00:00', '2010-01-01 00:00:00');
  //   const condition = ConditionUtils.buildExternalCondition(2, [mainDateFilter]);
  //   expect(condition.length).equal(1);
  // });
});
