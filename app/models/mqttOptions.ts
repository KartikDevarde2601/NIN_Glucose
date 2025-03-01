import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
/**
 * Model description here for TypeScript hints.
 */
export const MqttOptionsModel = types
  .model('MqttOptions')
  .props({
    password: types.optional(types.string, ''),
    enableSslConfig: types.optional(types.boolean, false),
    autoReconnect: types.optional(types.boolean, true),
    maxBackoffTime: types.optional(types.number, 60),
    retryCount: types.optional(types.number, 3),
    cleanSession: types.optional(types.boolean, true),
    keepAlive: types.optional(types.number, 60),
    jitter: types.optional(types.number, 1),
    username: types.optional(types.string, ''),
  })
  .actions(withSetPropAction)
  .views(self => ({}))
  .actions(self => ({
    edit(data: Partial<MqttOptions>) {
      Object.keys(data).forEach(key => {
        (self as any)[key as keyof MqttOptions] =
          data[key as keyof MqttOptions];
      });
    },
  }));
export interface MqttOptions extends Instance<typeof MqttOptionsModel> {}
export interface MqttOptionsSnapshotOut
  extends SnapshotOut<typeof MqttOptionsModel> {}
export interface MqttOptionsSnapshotIn
  extends SnapshotIn<typeof MqttOptionsModel> {}
