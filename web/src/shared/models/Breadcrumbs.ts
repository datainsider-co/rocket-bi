export class Breadcrumbs {
  public text: string;
  public to: any;
  public disabled: string;

  constructor(data: any = {}) {
    this.text = data.text || void 0;
    this.to = data.to || void 0;
    this.disabled = data.disabled || false;
  }
}
