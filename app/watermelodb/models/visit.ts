// visit.ts
import {Model, Relation, Query} from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
  children,
} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';
import {TableName} from '../schema';
import {Patient} from './patient';
import {Interval} from './interval';

export class Visit extends Model {
  static table = TableName.VISITS;

  static associations: Associations = {
    [TableName.PATIENTS]: {type: 'belongs_to', key: 'patient_id'},
    [TableName.INTERVALS]: {type: 'has_many', foreignKey: 'visit_id'},
  };

  @field('visitDate') visitDate!: string;
  @field('visitNotes') visitNotes!: string;
  @field('visitType') visitType!: string;

  @relation(TableName.PATIENTS, 'patient_id') patient!: Relation<Patient>;
  @children(TableName.INTERVALS) interval!: Query<Interval>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
