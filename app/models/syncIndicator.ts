import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';

/**
 * Model for tracking synchronization status of pump data (pd) and sensor data (sd)
 */

export enum SyncStatus_Enum {
  Done = 'Data is Synced ✅',
  NoData = 'No data',
  Syncing = 'Data is Syncing 🔄',
  Error = 'Error in Syncing ❌',
}

export const SyncStatusModel = types
  .model('SyncStatus')
  .props({
    pdstatus: types.enumeration<SyncStatus_Enum>(
      'PDStatus',
      Object.values(SyncStatus_Enum),
    ),
    pdtimestamp: types.maybe(types.Date),
    sdstatus: types.enumeration<SyncStatus_Enum>(
      'SDStatus',
      Object.values(SyncStatus_Enum),
    ),
    sdtimestamp: types.maybe(types.Date),
  })
  .actions(withSetPropAction)
  .views(self => ({}))
  .actions(self => ({
    setPdStatus(status: SyncStatus_Enum) {
      self.pdstatus = status;
    },
    setPdTimestamp(date: Date) {
      self.pdtimestamp = date;
    },
    setSdStatus(status: SyncStatus_Enum) {
      self.sdstatus = status;
    },
    setSdTimestamp(date: Date) {
      self.sdtimestamp = date;
    },
  }));

export interface SyncStatus extends Instance<typeof SyncStatusModel> {}
export interface SyncStatusSnapshotOut
  extends SnapshotOut<typeof SyncStatusModel> {}
export interface SyncStatusSnapshotIn
  extends SnapshotIn<typeof SyncStatusModel> {}
