import {Model, Query, Relation} from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  children,
  immutableRelation,
} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';
import {TableName} from '../schema';
import {Visit} from './visit';
import {Clinical} from './clinical';

export class Patient extends Model {
  static table = TableName.PATIENTS;

  // In Patient model (has-one clinical):
  static associations: Associations = {
    [TableName.CLINICALS]: {type: 'belongs_to', key: 'patient_id'}, // Changed to has_one
    [TableName.VISITS]: {type: 'has_many', foreignKey: 'patient_id'},
  };

  @field('fullName') fullName!: string;
  @field('email') email!: string;
  @field('dateOfBirth') dateOfBirth!: string;
  @field('contactInformation') contactInformation!: string;
  @field('age') age!: number;
  @field('gender') gender!: string;
  @field('height') height!: number;
  @field('weight') weight!: number;

  @immutableRelation(TableName.CLINICALS, 'patient_id')
  clinical!: Relation<Clinical>;
  @children(TableName.VISITS) visits!: Query<Visit>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
