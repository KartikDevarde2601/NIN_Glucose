import {Model, Query, Relation} from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  children,
  relation,
} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';
import {TableName} from '../schema';
import {Patient} from './patient';

export class Clinical extends Model {
  static table = TableName.CLINICALS;

  @field('bloodGroup') bloodGroup!: string;
  @field('antigenStatus') antigenStatus!: string;
  @field('systolic') systolic!: number;
  @field('diastolic') diastolic!: number;
  @field('temperature') temperature!: number;
  @field('smokingType') smokingType!: string;
  @field('overAllYearOfSmoking') overAllYearOfSmoking!: string;
  @field('dailyConsumption') dailyConsumption!: number;
  @field('smokingIndex') smokingIndex!: number;
  @field('alcoholFreeDays') alcoholFreeDays!: number;
  @field('alcoholType') alcoholType!: string;
  @field('alcoholConsumption') alcoholConsumption!: number;
  @field('hemoglobin') hemoglobin!: number;
  @field('reacentHealthIssue') reacentHealthIssue!: string;
  @field('hereditaryHistory') hereditaryHistory!: string;

  @relation(TableName.PATIENTS, 'patient_id') patients!: Relation<Patient>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
