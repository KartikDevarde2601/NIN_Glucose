import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import {ClinicModel} from './clinic';

/**
 * Model description here for TypeScript hints.
 */
export const VisitModel = types
  .model('Visit')
  .props({
    id: types.identifier,
    visitDate: types.string,
    visitNotes: types.string,
    clinic: types.reference(types.late(() => ClinicModel)),
  })
  .actions(withSetPropAction)
  .views(self => ({}))
  .actions(self => ({}));

export interface Visit extends Instance<typeof VisitModel> {}
export interface VisitSnapshotOut extends SnapshotOut<typeof VisitModel> {}
export interface VisitSnapshotIn extends SnapshotIn<typeof VisitModel> {}
