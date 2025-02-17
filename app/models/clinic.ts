import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';

/**
 * Model description here for TypeScript hints.
 */
export const ClinicModel = types
  .model('Clinic')
  .props({
    id: types.identifier,
    bloodGroup: types.string,
    antigenStatus: types.string,
    systolic: types.string,
    diastolic: types.string,
    temperature: types.string,
    smokingType: types.string,
    overAllYearOfSmoking: types.number,
    dailyConsumption: types.number,
    smokingIndex: types.number,
    alcoholFreeDays: types.number,
    alcoholType: types.string,
    alcoholConsumption: types.number,
    homoglobin: types.number,
    recentHealthIssue: types.string,
    hereditaryHistory: types.string,
  })
  .actions(withSetPropAction)
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})); // eslint-disable-line @typescript-eslint/no-unused-vars

export interface Clinic extends Instance<typeof ClinicModel> {}
export interface ClinicSnapshotOut extends SnapshotOut<typeof ClinicModel> {}
export interface ClinicSnapshotIn extends SnapshotIn<typeof ClinicModel> {}
