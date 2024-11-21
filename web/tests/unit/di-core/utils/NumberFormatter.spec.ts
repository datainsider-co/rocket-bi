// import { expect } from 'chai';
// import { NumberFormatter } from '@core/common/services/Formatter';
// import { HighchartUtils, MetricNumberMode } from '@/utils';
//
// describe('Test Number Formatter with default metrics', () => {
//   const metricsNumber = HighchartUtils.toMetricNumbers(MetricNumberMode.Default);
//   const ranges = HighchartUtils.buildRangeData(metricsNumber);
//   //default roundingPrecision = 2
//   const numberFormatter = new NumberFormatter(ranges);
//
//   it('should normalize number 1000', () => {
//     const formattedData: string = numberFormatter.format(1000);
//     expect(formattedData).eq('1k');
//   });
//
//   it('should normalize number 1 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000);
//     expect(formattedData).eq('1M');
//   });
//
//   it('should normalize number 1 000 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000000);
//     expect(formattedData).eq('1B');
//   });
//
//   it('should normalize number 1 000 000 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000000000);
//     expect(formattedData).eq('1T');
//   });
//
//   it('should normalize number 1 000 000 000 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000000000000);
//     expect(formattedData).eq('1P');
//   });
//
//   it('should normalize number 1 000 000 000 000 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000000000000000);
//     expect(formattedData).eq('1E');
//   });
//
//   it('should normalize number 1 000 000 000 000 000 000', () => {
//     const formattedData: string = numberFormatter.format(1000000000000000000);
//     expect(formattedData).eq('1E');
//   });
//
//   it('should normalize number 1 230 000 ', () => {
//     const formattedData: string = numberFormatter.format(1230000);
//     expect(formattedData).eq('1.23M');
//   });
//
//   it('should normalize number 1 239 000 ', () => {
//     const formattedData: string = numberFormatter.format(1239000);
//     expect(formattedData).eq('1.24M');
//   });
//
//   it('should normalize number 1 235.123 ', () => {
//     const formattedData: string = numberFormatter.format(1235.123);
//     expect(formattedData).eq('1.24k');
//   });
//
//   it('should normalize negative number  -1 230 ', () => {
//     const formattedData: string = numberFormatter.format(-1230);
//     expect(formattedData).eq('-1.23k');
//   });
//
//   it('should normalize negative number  -1 230.123 ', () => {
//     const formattedData: string = numberFormatter.format(-1230.123);
//     expect(formattedData).eq('-1.23k');
//   });
//
//   it('should normalize negative number  -1 230 000.123 ', () => {
//     const formattedData: string = numberFormatter.format(-1230000.123);
//     expect(formattedData).eq('-1.23M');
//   });
//
//   it('should normalize number 0 ', () => {
//     const formattedData: string = numberFormatter.format(0);
//     expect(formattedData).eq('0');
//   });
//
//   it('should normalize number 200 ', () => {
//     const formattedData: string = numberFormatter.format(200);
//     expect(formattedData).eq('200');
//   });
//
//   it('should normalize number 200.01 ', () => {
//     const formattedData: string = numberFormatter.format(200.01);
//     expect(formattedData).eq('200.01');
//   });
//
//   it('should normalize number 200.01 ', () => {
//     const formattedData: string = numberFormatter.format(200.01);
//     expect(formattedData).eq('200.01');
//   });
//
//   it('should normalize number 200.012', () => {
//     const formattedData: string = numberFormatter.format(200.012);
//     expect(formattedData).eq('200.01');
//   });
//
//   it('should normalize number 2000.012', () => {
//     const formattedData: string = numberFormatter.format(2000.12);
//     expect(formattedData).eq('2k');
//   });
//
//   it('should normalize number 4 995 000', () => {
//     const formattedData: string = numberFormatter.format(4995000);
//     expect(formattedData).eq('5M');
//   });
//
//   it('should normalize number 999', () => {
//     const formattedData: string = numberFormatter.format(999);
//     expect(formattedData).eq('999');
//   });
//
//   it('should normalize number 485 012', () => {
//     const formattedData: string = numberFormatter.format(485012);
//     expect(formattedData).eq('485.01k');
//   });
//
//   it('should normalize number 48 501', () => {
//     const formattedData: string = numberFormatter.format(48501);
//     expect(formattedData).eq('48.5k');
//   });
// });
