export class DatabaseCreateRequest {
  name!: string;
  displayName?: string;

  constructor(name: string, displayName: string) {
    this.name = name;
    this.displayName = displayName;
  }
}
