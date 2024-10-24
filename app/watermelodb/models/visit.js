import {Model} from '@nozbe/watermelondb';
import {field, writer, children} from '@nozbe/watermelondb/decorators';
import {relation} from '@nozbe/watermelondb/decorators';

export default class Visit extends Model {
  static table = 'visits';

  static associations = {
    patients: {type: 'belongs_to', key: 'patient_id'},
    clinical: {type: 'belongs_to', key: 'visit_id'},
    BIA: {type: 'has_many', foreignKey: 'visit_id'},
    GSR: {type: 'has_many', foreignKey: 'visit_id'},
    GLU: {type: 'has_many', foreignKey: 'visit_id'},
    TEM: {type: 'has_many', foreignKey: 'visit_id'},
  };

  @field('patient_id') patient_id;
  @field('visitDate') visitDate;
  @field('visitNotes') visitNotes;
  @field('isClinicalCollected') isClinicalCollected;
  @field('isDataCollected') isDataCollected;
  @relation('patient', 'patient_id') patient;
  @relation('clinics', 'visit_id') clinic;
  @children('BIA') BIA;
  @children('GSR') GSR;
  @children('GLU') GLU;
  @children('TEM') TEM;

  @writer async addClinical(clinicalInfo) {
    return await this.collections.get('clinics').create(clinic => {
      clinic.visit.id = this._raw.id;
      clinic.bloodGroup = clinicalInfo.bloodGroup;
      clinic.antigenStatus = clinicalInfo.antigenStatus;
      clinic.systolic = clinicalInfo.systolic;
      clinic.diastolic = clinicalInfo.diastolic;
      clinic.temperature = clinicalInfo.temperature;
      clinic.smokingType = clinicalInfo.smokingType;
      clinic.overAllYearOfSmoking = clinicalInfo.overAllYearOfSmoking;
      clinic.dailyConsumption = clinicalInfo.dailyConsumption;
      clinic.smokingIndex = clinicalInfo.smokingIndex;
      clinic.alcoholFreeDays = clinicalInfo.alcoholFreeDays;
      clinic.alcoholType = clinicalInfo.alcoholType;
      clinic.alcoholConsumption = clinicalInfo.alcoholConsumption;
      clinic.homoglobin = clinicalInfo.homoglobin;
      clinic.reacentHealthIssue = clinicalInfo.reacentHealthIssue;
      clinic.hereditaryHistory = clinicalInfo.hereditaryHistory;
    });
  }

  @writer async addBIA(BIAInfo) {
    return await this.collections.get('BIA').create(BIA => {
      BIA.visit.id = this._raw.id;
      BIA.time = BIAInfo.time;
      BIA.config = BIAInfo.config;
      BIA.freq = BIAInfo.freq;
      BIA.data = BIAInfo.data;
    });
  }

  @writer async addGSR(GSRInfo) {
    await this.collections.get('GSR').create(GSR => {
      GSR.visit.id = this._raw.id;
      GSR.time = GSRInfo.time;
      GSR.config = GSRInfo.config;
      GSR.freq = GSRInfo.freq;
      GSR.data = GSRInfo.data;
    });
  }

  @writer async addGLU(GLUInfo) {
    await this.collections.get('GLU').create(GLU => {
      GLU.visit.id = this._raw.id;
      GLU.time = GLUInfo.time;
      GLU.config = GLUInfo.config;
      GLU.freq = GLUInfo.freq;
      GLU.data = GLUInfo.data;
    });
  }

  @writer async addTEM(TEMInfo) {
    await this.collections.get('TEM').create(TEM => {
      TEM.visit.id = this._raw.id;
      TEM.time = TEMInfo.time;
      TEM.config = TEMInfo.config;
      TEM.freq = TEMInfo.freq;
      TEM.data = TEMInfo.data;
    });
  }

  @writer async ClinicalDataCollected() {
    return await this.update(clinic => {
      clinic.isClinicalCollected = true;
    });
  }

  @writer async DataCollected() {
    await this.update(clinic => {
      clinic.isDataCollected = true;
    });
  }
}
