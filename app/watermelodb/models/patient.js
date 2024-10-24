import {field, children, action, writer} from '@nozbe/watermelondb/decorators';
import {Model} from '@nozbe/watermelondb';

export default class Patient extends Model {
  static table = 'patients';

  static associations = {
    visits: {type: 'has_many', foreignKey: 'patient_id'},
  };

  @field('name') name;
  @field('dateofBirth') dateofBirth;
  @field('contactInformation') contactInformation;
  @field('age') age;
  @field('gender') gender;
  @field('height') height;
  @field('weight') weight;
  @children('visits') visits;

  @writer async addvisit() {
    const newVisit = await this.collections.get('visits').create(visit => {
      visit.patient.id = this._raw.id;
      visit.visitDate = new Date().toISOString();
      visit.isClinicalCollected = false;
      visit.isDataCollected = false;
    });
    return newVisit;
  }
}
