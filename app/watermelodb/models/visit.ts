// visit.ts
import {Model, Relation} from '@nozbe/watermelondb';
import {field, readonly, date, relation} from '@nozbe/watermelondb/decorators';
import {TableName} from '../schema';
import {Patient} from './patient';
import {Clinical} from './clinical';

export class Visit extends Model {
  static table = TableName.VISITS;

  @field('visitDate') visitDate!: string;
  @field('visitNotes') visitNotes!: string; // Corrected typo: visitNote -> visitNotes
  @relation(TableName.PATIENTS, 'patient_id') patient!: Relation<Patient>;
  @relation(TableName.CLINICALS, 'visit_id') clinical!: Relation<Clinical>; // Changed to relation

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
