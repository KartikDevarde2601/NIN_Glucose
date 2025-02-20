// schema.ts
import {appSchema, tableSchema} from '@nozbe/watermelondb';
import {string} from 'mobx-state-tree/dist/internal';

export enum TableName {
  PATIENTS = 'patients',
  VISITS = 'visits',
  CLINICALS = 'clinicals',
  INTERVALS = 'intervals',
}

const schema = appSchema({
  version: 5,
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
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: TableName.VISITS,
      columns: [
        {name: 'patient_id', type: 'string', isIndexed: true},
        {name: 'visitDate', type: 'string'},
        {name: 'visitNotes', type: 'string'},
        {name: 'visitType', type: 'string'},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: TableName.INTERVALS,
      columns: [
        {name: 'visit_id', type: 'string', isIndexed: true},
        {name: 'intervalType', type: 'string'},
        {name: 'interval_tag', type: 'number'},
        {name: 'configuration', type: 'string'},
        {name: 'frequencies', type: 'string'},
        {name: 'dataPoints', type: 'string'},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
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
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
  ],
});

export default schema;
