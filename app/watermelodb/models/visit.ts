// visit.ts
import {Model, Relation} from '@nozbe/watermelondb';
import {field, readonly, date, relation} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';
import {TableName} from '../schema';
import {Patient} from './patient';

export class Visit extends Model {
  static table = TableName.VISITS;

  static associations: Associations = {
    [TableName.PATIENTS]: {type: 'belongs_to', key: 'patient_id'},
  };

  @field('visitDate') visitDate!: string;
  @field('visitNotes') visitNotes!: string;

  @relation(TableName.PATIENTS, 'patient_id') patient!: Relation<Patient>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
