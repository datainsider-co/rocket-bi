// import { expect } from 'chai';
// import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
//
// describe('Formula query', () => {
//   it('test normal select', () => {
//     const query = 'select * from sales';
//     const etlQuery = FormulaUtils.toETLQuery(query, 'db_1', 'sales');
//     expect(etlQuery)('select * from `db_1`.`sales`');
//   });
//
//   it('test select with unknown name', () => {
//     const query = 'select * from dashboards';
//     const etlQuery = FormulaUtils.toETLQuery(query, 'db_1', 'sales');
//     expect(etlQuery)('select * from dashboards');
//   });
//
//   it('test select with has dbname', () => {
//     const query = 'select * from db_1.sales';
//     const etlQuery = FormulaUtils.toETLQuery(query, 'db_1', 'sales');
//     expect(etlQuery)('select * from `db_1`.`sales`');
//   });
// });
