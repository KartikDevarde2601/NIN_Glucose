import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import {VisitModel} from './visit';
/**
 * Model description here for TypeScript hints.
 */

export const PatientModel = types
  .model('Patient')
  .props({
    id: types.identifier,
    fullName: types.string,
    email: types.string,
    dateOfBirth: types.string,
    contactInformation: types.string,
    age: types.number,
    gender: types.enumeration('Gender', ['Male', 'Female']),
    height: types.number,
    weight: types.number,
    visits: types.array(types.reference(types.late(() => VisitModel))),
  })
  .actions(withSetPropAction)
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})); // eslint-disable-line @typescript-eslint/no-unused-vars

export interface Patient extends Instance<typeof PatientModel> {}
export interface PatientSnapshotOut extends SnapshotOut<typeof PatientModel> {}
export interface PatientSnapshotIn extends SnapshotIn<typeof PatientModel> {}
