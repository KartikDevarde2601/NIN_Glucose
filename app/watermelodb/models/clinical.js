import {Model} from '@nozbe/watermelondb';
import {field} from '@nozbe/watermelondb/decorators';
import {relation} from '@nozbe/watermelondb/decorators';

export default class Clinical extends Model {
  static table = 'clinics';
  static associations = {
    patients: {type: 'has_one', key: 'visit_id'},
  };

  @field('bloodGroup') bloodGroup;
  @field('antigenStatus') antigenStatus;
  @field('systolic') systolic;
  @field('diastolic') diastolic;
  @field('temperature') temperature;
  @field('smokingType') smokingType;
  @field('overAllYearOfSmoking') overAllYearOfSmoking;
  @field('dailyConsumption') dailyConsumption;
  @field('smokingIndex') smokingIndex;
  @field('alcoholFreeDays') alcoholFreeDays;
  @field('alcoholType') alcoholType;
  @field('alcoholConsumption') alcoholConsumption;
  @field('homoglobin') homoglobin;
  @field('reacentHealthIssue') reacentHealthIssue;
  @field('hereditaryHistory') hereditaryHistory;
  @relation('visit', 'visit_id') visit;
}
