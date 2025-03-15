import {Instance, SnapshotOut, types} from 'mobx-state-tree';
import {AuthenticationStoreModel} from './AuthenticationStore';
import {SyncStatusModel} from './syncIndicator';
import {SyncStatus_Enum} from './syncIndicator';
/**
 * A RootStore model.
 */
export const RootStoreModel = types.model('RootStore').props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  sync: types.optional(SyncStatusModel, {
    pdstatus: SyncStatus_Enum.NoData,
    pdtimestamp: undefined,
    sdstatus: SyncStatus_Enum.NoData,
    sdtimestamp: undefined,
  }),
});

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
