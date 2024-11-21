export class DetectExpressionTypeRequest {
  constructor(public dbName: string, public tblName: string, public expression: string) {}
}
