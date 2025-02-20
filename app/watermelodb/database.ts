// database.ts
import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {setGenerator} from '@nozbe/watermelondb/utils/common/randomId';
import {Patient} from './models/patient';
import {Visit} from './models/visit';
import {Clinical} from './models/clinical';
import {Interval} from './models/interval';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema: schema,
  dbName: 'ihub_bia',
  jsi: true,
  onSetUpError: error => {
    console.log('onSetUpError', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Patient, Visit, Clinical, Interval],
});

//setGenerator(() => Crypto.randomUUID());
