import {Instance, SnapshotOut, types} from 'mobx-state-tree';
import {AuthenticationStoreModel} from './AuthenticationStore';
import {MqttStore} from './mqtt';
/**
 * A RootStore model.
 */
export const RootStoreModel = types.model('RootStore').props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  mqtt: types.optional(MqttStore, {
    clientId: 'Mobileclient',
    host: '192.168.102.149',
    port: 1883,
    options: {},
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
