import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import {Database} from '@nozbe/watermelondb';
import migrations from './migrations';

import Patient from './models/patient';
import Visit from './models/visit';
import Clinical from './models/clinical';

const adapter = new SQLiteAdapter({
  schema: schema,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [Patient, Visit, Clinical],
  actionEnabled: true,
});
