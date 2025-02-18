// schema.ts
import {appSchema, tableSchema} from '@nozbe/watermelondb';

export enum TableName {
  PATIENTS = 'patients',
  VISITS = 'visits',
  CLINICALS = 'clinicals',
}

const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: TableName.PATIENTS,
      columns: [
        {name: 'fullName', type: 'string'},
        {name: 'email', type: 'string'},
        {name: 'dateOfBirth', type: 'string'},
        {name: 'contactInformation', type: 'string'},
        {name: 'age', type: 'number'},
        {name: 'gender', type: 'string'},
        {name: 'height', type: 'number'},
        {name: 'weight', type: 'number'},
      ],
    }),
    tableSchema({
      name: TableName.VISITS,
      columns: [
        {name: 'patient_id', type: 'string', isIndexed: true},
        {name: 'visitDate', type: 'string'},
        {name: 'visitNotes', type: 'string'},
        {name: 'visitType', type: 'string'},
      ],
    }),
    tableSchema({
      name: TableName.CLINICALS,
      columns: [
        {name: 'patient_id', type: 'string', isIndexed: true},
        {name: 'bloodGroup', type: 'string'},
        {name: 'antigenStatus', type: 'string'},
        {name: 'systolic', type: 'number'},
        {name: 'diastolic', type: 'number'},
        {name: 'temperature', type: 'number'},
        {name: 'smokingType', type: 'string'},
        {name: 'overAllYearOfSmoking', type: 'number'},
        {name: 'dailyConsumption', type: 'number'},
        {name: 'smokingIndex', type: 'number'},
        {name: 'alcoholFreeDays', type: 'number'},
        {name: 'alcoholType', type: 'string'},
        {name: 'alcoholConsumption', type: 'number'},
        {name: 'hemoglobin', type: 'number'},
        {name: 'reacentHealthIssue', type: 'string'},
        {name: 'hereditaryHistory', type: 'string'},
      ],
    }),
  ],
});

export default schema;
