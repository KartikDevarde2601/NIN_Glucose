// patient.ts
import {Model, Query} from '@nozbe/watermelondb';
import {field, readonly, date, children} from '@nozbe/watermelondb/decorators';
import {TableName} from '../schema';
import {Visit} from './visit';

export class Patient extends Model {
  static table = TableName.PATIENTS;

  @field('fullName') fullName!: string;
  @field('email') email!: string;
  @field('dateOfBirth') dateOfBirth!: string;
  @field('contactInformation') contactInformation!: string;
  @field('age') age!: number;
  @field('gender') gender!: string;
  @field('height') height!: number;
  @field('weight') weight!: number;
  @children(TableName.VISITS) visits!: Query<Visit>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
