export class EditUserPropertyRequest {
  constructor(public username: string, public properties: { [key: string]: string }, public deletedPropertyKeys: string[]) {}
}
