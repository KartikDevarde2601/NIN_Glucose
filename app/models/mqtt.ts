import {
  types,
  flow,
  Instance,
  destroy,
  SnapshotOut,
  SnapshotIn,
} from 'mobx-state-tree';
import {
  createMqttClient,
  MqttConfig,
  SubscribeMqtt,
} from '@kartik2601/rn-mqtt-android';
import {MqttClient} from '@kartik2601/rn-mqtt-android/dist/Mqtt/MqttClient';
import {Interval} from '../watermelodb/models/interval';
import {MqttOptionsModel} from './mqttOptions';

// Enum for connection status
export enum ConnectionStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}
// Enum for QoS levels
export enum MqttQos {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}

// MQTT Store Model
export const MqttStore = types
  .model('MqttStore')
  .props({
    clientId: types.optional(types.string, ''),
    host: types.optional(types.string, ''),
    port: types.optional(types.number, 1883),
    options: types.optional(MqttOptionsModel, {}),
    currentSessionName: types.optional(types.string, ''),
    status: types.optional(
      types.enumeration('ConnectionStatus', Object.values(ConnectionStatus)),
      ConnectionStatus.IDLE,
    ),
  })
  .volatile(self => ({
    client: null as MqttClient | null,
    isconnected: false,
  }))
  .views(self => ({}))
  .actions(self => {
    const initializeClient = flow(function* () {
      if (self.client) {
        return self.client;
      }

      // Prevent multiple initializations
      if (self.status === ConnectionStatus.INITIALIZING) {
        return null;
      }

      if (self.clientId === '' || self.host === '') {
        self.status = ConnectionStatus.ERROR;
        return null;
      }

      try {
        // Update status to initializing
        self.status = ConnectionStatus.INITIALIZING;

        // Configuration for MQTT client
        const config: MqttConfig = {
          clientId: self.clientId,
          host: self.host,
          port: self.port,
          options: self.options,
        };

        self.client = yield createMqttClient(config);

        console.log('mqtt client', self.client);

        return self.client;
      } catch (error) {
        self.status = ConnectionStatus.ERROR;
        console.error('Error during MQTT initialization:', error);
        return null;
      }
    });

    const connect = flow(function* (): Generator<any, void, any> {
      if (!self.client) {
        console.log('Client not initialized');
        return;
      }

      try {
        self.status = ConnectionStatus.CONNECTING;
        yield Promise.resolve(self.client.connect());
        console.log('MQTT Connected');
      } catch (error) {
        self.status = ConnectionStatus.ERROR;
        console.error('Error during MQTT connection:', error);
      }
    });

    const disconnect = flow(function* () {
      if (!self.client) {
        return;
      }

      try {
        self.client.disconnect();
        console.log('mqtt disconnected');
      } catch (error) {
        self.status = ConnectionStatus.ERROR;
        console.error('Error during MQTT disconnection:', error);
      }
    });

    const cleanup = () => {
      // Disconnect and remove client
      if (self.client) {
        try {
          self.client.disconnect();
          self.client.remove();
          console.log('MQTT client removed');
        } catch (error) {
          console.error('Error during MQTT cleanup:', error);
        }

        // Clear client reference
        self.client = null;
      }

      // Reset store state
      self.status = ConnectionStatus.IDLE;
    };

    const editConfig = flow(function* (data: Partial<MqttConfig>) {
      Object.keys(data).forEach(key => {
        (self as any)[key] = data[key as keyof MqttConfig];
      });

      cleanup();
      console.log('MQTT client Cleanup');

      // Wait for client initialization to complete
      yield initializeClient();
      console.log('MQTT client Reinitialized');

      // Only try to connect if client was successfully initialized
      if (self.client) {
        console.log('client create succefully');
      }
    });

    const updateStatus = (status: ConnectionStatus) => {
      self.status = status;
    };

    const updateIsConnected = (isConnected: boolean) => {
      self.isconnected = isConnected;
    };

    return {
      initializeClient,
      connect,
      disconnect,
      cleanup,
      editConfig,
      updateStatus,
      updateIsConnected,
    };
  })
  .views(self => ({
    get isConnected() {
      return self.status === ConnectionStatus.CONNECTED;
    },
  }));

export interface Mqtt extends Instance<typeof MqttStore> {}
export interface MqttSnapshotOut extends SnapshotOut<typeof MqttStore> {}
export interface MqttSnapshotIn extends SnapshotIn<typeof MqttStore> {}
