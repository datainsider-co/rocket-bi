import deneric from 'deneric';
import { DEFAULT_ORGANIZATION_ID } from './Enum';

export class TableColumn extends deneric.Entity {
  constructor(data) {
    super(data, {
      class_name: ['class_name', deneric.String],
      name: ['name', deneric.String],
      display_name: ['display_name', deneric.String],
      input_formats: ['input_formats', deneric.Array],
      is_nullable: ['is_nullable', deneric.Boolean]
    });
  }
}

export class Table extends deneric.Entity {
  constructor(data) {
    super(data, {
      db_name: ['db_name', deneric.String],
      name: ['name', deneric.String],
      display_name: ['display_name', deneric.String],
      columns: ['columns', [TableColumn]]
    });
  }
}

export class Database extends deneric.Entity {
  constructor(data, mappings = {}) {
    super(data, {
      display_name: ['display_name', deneric.String],
      name: ['name', deneric.String],
      organization_id: ['organization_id', deneric.Number, DEFAULT_ORGANIZATION_ID],
      tables: ['tables', [Table]]
    });
  }
}

export class DocumentSchema extends deneric.Entity {
  constructor(data) {
    super(data, {
      name: ['name', deneric.String],
      db_name: ['db_name', deneric.String],
      organization_id: ['organization_id', deneric.Number, 1],
      display_name: ['display_name', deneric.String],
      columns: ['columns', [TableColumn]]
    });
  }
}
