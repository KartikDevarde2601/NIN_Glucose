import {Model, Relation} from '@nozbe/watermelondb';
import {field, readonly, date, relation} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';
import {TableName} from '../schema';
import {Visit} from './visit';

export class Interval extends Model {
  static table = TableName.INTERVALS;

  static associations: Associations = {
    [TableName.VISITS]: {type: 'belongs_to', key: 'visit_id'},
  };

  @field('intervalType') intervalType!: string;
  @field('interval_tag') interval_tag!: number;
  @field('configuration') configuration!: string;
  @field('frequencies') frequencies!: string;
  @field('dataPoints') dataPoints!: string;

  @relation(TableName.VISITS, 'visit_id') visit!: Relation<Visit>;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
