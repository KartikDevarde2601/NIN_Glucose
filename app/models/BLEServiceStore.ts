import {
  Instance,
  SnapshotIn,
  SnapshotOut,
  types,
  flow,
  getParent,
} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import {BLEImpedanceModel} from './BLEImpedance';
import {RootStore} from './RootStore';
/**
 * Model description here for TypeScript hints.
 */
export const BLEserviceModel = types
  .model('BLEservice')
  .props({
    impedanceService: types.optional(BLEImpedanceModel, {}),
  })
  .actions(withSetPropAction)
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({
    // Initialize all services
    initializeServices: flow(function* () {
      // @ts-ignore - Access root store
      const rootStore = getParent(self) as RootStore;

      if (!rootStore.BLE.isConnected) {
        throw new Error('BLE not connected');
      }
      yield self.impedanceService.initialize();
      return true;
    }),
  }));

export interface BLEservice extends Instance<typeof BLEserviceModel> {}
export interface BLEserviceSnapshotOut
  extends SnapshotOut<typeof BLEserviceModel> {}
export interface BLEserviceSnapshotIn
  extends SnapshotIn<typeof BLEserviceModel> {}
export const createBLEserviceDefaultModel = () =>
  types.optional(BLEserviceModel, {});
