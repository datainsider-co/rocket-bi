// /*
//  * @author: tvc12 - Thien Vi
//  * @created: 4/26/21, 5:58 PM
//  */
//
// import { DateColumn, DoubleColumn, Expression, Int32Column, StringColumn, TableSchema, TableType } from '@core/common/domain/model';
// import { ExpressionParser, RawExpressionData } from '@core/schema/service/ExpressionParser';
// import { expect } from 'chai';
//
// describe('Expression Parser', () => {
//   const columns = [
//     new DateColumn('order_date', 'Order Date', []),
//     new Int32Column('order_id', 'Order Id', true, false, false),
//     new StringColumn('country', 'Country', true, false, false),
//     new DoubleColumn('total_profit', 'Total Profit', true, false, false)
//   ];
//   const table = new TableSchema('bill', 'db_test', 1, 'Bill', columns, TableType.Default, [], []);
//   it('Should parse with empty expression', () => {
//     const rawData = new RawExpressionData('', table);
//     try {
//       const result = ExpressionParser.parse(rawData);
//     } catch (ex) {
//       expect(true).true;
//       return;
//     }
//     expect(false).true;
//   });
//
//   it('Should parse with correct syntax', () => {
//     const rawData = new RawExpressionData('[Order Date] * 1.5', table);
//     // const result: Expression = ExpressionParser.parse(rawData);
//     // expect(result).is.not.null;
//     // expect(result.expr).equal('order_id * 1.5');
//   });
//
//   it('Should parse with two field', () => {
//     const rawData = new RawExpressionData('[Total Profit] + [Order Id]', table);
//     // const result: Expression = ExpressionParser.parse(rawData);
//     // expect(result).is.not.null;
//     // expect(result.expr).equal('total_profit + order_id');
//   });
//
//   it('Should parse with no field', () => {
//     const rawData = new RawExpressionData('Total Profit', table);
//     // const result: Expression = ExpressionParser.parse(rawData);
//     // expect(result).is.not.null;
//     // expect(result.expr).equal('Total Profit');
//   });
//
//   it('Should parse with invalid field', () => {
//     const rawData = new RawExpressionData('[Total] + Profit', table);
//     try {
//       const result: Expression = ExpressionParser.parse(rawData);
//     } catch (ex) {
//       expect(true).true;
//       return;
//     }
//     expect(false).true;
//   });
// });
