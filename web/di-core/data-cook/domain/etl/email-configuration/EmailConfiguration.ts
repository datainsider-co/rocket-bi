export class EmailConfiguration {
  displayName: string;
  receivers: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  fileName: string;

  constructor(displayName: string, receivers: string[], subject: string, content: string, fileName: string, cc: string[] = [], bcc: string[] = []) {
    this.displayName = displayName;
    this.receivers = receivers;
    this.subject = subject;
    this.content = content;
    this.fileName = fileName;
    this.bcc = bcc;
    this.cc = cc;
  }

  static fromObject(obj: EmailConfiguration): EmailConfiguration {
    return new EmailConfiguration(obj.displayName, obj.receivers, obj.subject, obj.content, obj.fileName, obj.bcc, obj.cc);
  }

  static default(fileName: string) {
    return new EmailConfiguration('', [], '', '', fileName, [], []);
  }
}
