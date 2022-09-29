import { StringUtils } from '@/utils/StringUtils';

export enum FileType {
  Folder = 0,
  File = 1
}

export enum FormatType {
  Unknown,
  Parquet,
  Media
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  Pdf = 'pdf'
}

export class FileInfo {
  static readonly PARENT_DIRECTORY_NAME = '..';
  static readonly ALL_FILE_PATH = '/*';

  formatType: FormatType;
  type: FileType;
  name: string;
  sizeInByte: number;
  date: number;
  group: string;
  permission: string;
  creator: string;
  contentType?: string;

  constructor(
    formatType: FormatType,
    type: FileType,
    name: string,
    sizeInByte: number,
    date: number,
    group: string,
    permission: string,
    creator: string,
    contentType?: string
  ) {
    this.formatType = formatType;
    this.type = type;
    this.name = name;
    this.sizeInByte = sizeInByte;
    this.date = date;
    this.group = group;
    this.permission = permission;
    this.creator = creator;
    this.contentType = contentType;
  }

  get isImage() {
    const [type] = StringUtils.getMineType(this.contentType);
    return type === MediaType.Image;
  }

  get isVideo() {
    const [type] = StringUtils.getMineType(this.contentType);
    return type === MediaType.Video;
  }

  get isPdf() {
    const [_, subType] = StringUtils.getMineType(this.contentType);
    return subType === MediaType.Pdf;
  }

  get isParquet() {
    return this.formatType === FormatType.Parquet;
  }

  get isFolder() {
    return this.type === FileType.Folder;
  }

  get isCsv() {
    return this.formatType === FormatType.Unknown && this.name.endsWith('.csv');
  }

  static default(): FileInfo {
    return new FileInfo(0, FileType.Folder, 'Unknown', 0, 0, '', '', '');
  }

  static parentDirectory(): FileInfo {
    return new FileInfo(0, FileType.Folder, FileInfo.PARENT_DIRECTORY_NAME, 0, 0, '', '', '');
  }

  static fromName(name: string): FileInfo {
    return new FileInfo(0, FileType.Folder, name, 0, 0, '', '', '');
  }

  static isParentDirectory(fileName: string): boolean {
    return fileName === FileInfo.PARENT_DIRECTORY_NAME;
  }

  static mock(): FileInfo {
    return new FileInfo(0, FileType.File, 'Animal.csv', 1024, Date.now(), 'admin', 'rw--wr', 'meo');
  }

  static fromObject(obj: any & FileInfo): FileInfo {
    return new FileInfo(obj.formatType, obj.type, obj.name, obj.sizeInByte, obj.date, obj.group, obj.permission, obj.creator, obj.contentType);
  }
}
