export const DEFAULT_ORGANIZATION_ID = 1;

export const UPLOAD_STAGE = {
  browse_file: 'browse_file',
  preview_file: 'preview_file',
  describe_db: 'describe_db',
  uploading: 'uploading'
};

export const UPLOAD_TITLE = {
  [UPLOAD_STAGE.browse_file]: 'Add New Data',
  [UPLOAD_STAGE.preview_file]: 'Create new file upload dataset',
  [UPLOAD_STAGE.describe_db]: 'Create new file upload dataset',
  [UPLOAD_STAGE.uploading]: 'Upload data'
};

export const GOOGLE_SHEET_TITLE = {
  [UPLOAD_STAGE.browse_file]: 'Add New Data',
  [UPLOAD_STAGE.preview_file]: 'Google sheet preview',
  [UPLOAD_STAGE.describe_db]: 'Add Google sheet job'
};

export const UPLOAD_DESC = {
  [UPLOAD_STAGE.browse_file]: 'Upload spreadsheet',
  [UPLOAD_STAGE.preview_file]: 'Select tables',
  [UPLOAD_STAGE.describe_db]: 'Name & Describe Your DataSet',
  [UPLOAD_STAGE.uploading]: 'Importing data to server'
};

export const GOOGLE_SHEET_DESC = {
  [UPLOAD_STAGE.browse_file]: 'Google sheet spreadsheet',
  [UPLOAD_STAGE.preview_file]: 'Select schema',
  [UPLOAD_STAGE.describe_db]: 'Config information for Google sheet'
};

export const ENCODING = {
  ASCII: 'ASCII',
  UTF_8: 'UTF-8',
  UTF_16: 'UTF-16',
  UTF_32: 'UTF-32'
};

export const DELIMITER = {
  comma: ',',
  semicolon: ';',
  hyphen: '-',
  dash: '_',
  vertical_bar: '|',
  tab: '\t'
};

export const SKIP_ROWS = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  13: '13',
  14: '14',
  15: '15',
  16: '16',
  17: '17',
  18: '18',
  19: '19',
  20: '20'
};

export const COLUMN_DATA_TYPE = {
  bool: 'bool',
  int32: 'int32',
  int64: 'int64',
  double: 'double',
  string: 'string',
  date: 'date',
  datetime: 'datetime'
};

export const COLUMN_DATA_TYPE_NAME = {
  [COLUMN_DATA_TYPE.bool]: 'Bool',
  [COLUMN_DATA_TYPE.int32]: 'Int32',
  [COLUMN_DATA_TYPE.int64]: 'Int64',
  [COLUMN_DATA_TYPE.double]: 'Double',
  [COLUMN_DATA_TYPE.string]: 'String',
  [COLUMN_DATA_TYPE.date]: 'Date',
  [COLUMN_DATA_TYPE.datetime]: 'DateTime'
};
