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
import {rawdata, Topic} from './topic';
import {number} from 'mobx-state-tree/dist/internal';
import {Interval} from '../watermelodb/models/interval';

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

interface Subscription {
  remove: () => void;
}

// MQTT Store Model
export const MqttStore = types
  .model('MqttStore')
  .props({
    clientId: types.string,
    host: types.string,
    isconnected: types.optional(types.boolean, false),
    port: types.optional(types.number, 1883),
    options: types.optional(types.frozen(), {}),
    currentSessionName: types.optional(types.string, ''),
    status: types.optional(
      types.enumeration('ConnectionStatus', Object.values(ConnectionStatus)),
      ConnectionStatus.IDLE,
    ),
  })
  .volatile(self => ({
    client: null as MqttClient | null,
    topicSubscribed: new Map<string, Subscription>(),
    currentInterval: null as Interval | null,
  }))
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

        // Update status
        self.status = ConnectionStatus.DISCONNECTED;

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

    const editConfig = (data: Partial<MqttConfig>) => {
      Object.keys(data).forEach(key => {
        (self as any)[key] = data[key as keyof MqttConfig];
      });

      cleanup();
      console.log('MQTT client Cleanup');
      initializeClient();
      console.log('MQTT client Reinitialized');
    };

    const subscribe = (topic: Topic) => {
      if (!self.client) {
        return;
      }
      const subscription: Subscription = self.client.subscribe({
        topic: topic.topicName,
        qos: MqttQos.AT_LEAST_ONCE,
        onSuccess: ack => {
          topic.updateSubcriptionStats();
          console.log(`MQTT Subscription Success: ${ack}`);
        },
        onError: error => {
          console.error(`MQTT Subscription Error: ${error}`);
          topic.addError(error.errorMessage);
        },
        onEvent: ({payload}) => {
          console.log(`MQTT Subscription data: ${payload}`);
          if (self.currentInterval != null) {
            topic.addMessage(
              payload as unknown as rawdata,
              self.currentInterval.visit.id,
              self.currentInterval.interval_tag,
              self.currentInterval.interval,
            );
          }
        },
      });
      self.topicSubscribed.set(topic.id, subscription);
    };

    const setSessionName = (sessionName: string) => {
      self.currentSessionName = sessionName;
    };

    const unsubscribe = (topic: Topic) => {
      if (!self.client) {
        console.log('Client not initialized');
        return;
      }
      const subscription = self.topicSubscribed.get(topic.id);
      console.log('Unsubscribing using Subscription: ', subscription);
      if (subscription) {
        subscription.remove();
        self.topicSubscribed.delete(topic.id);
        topic.updateSubcriptionStats();
        console.log(
          `Unsubscribed from topic: ${topic.topicName} with ID: ${topic.id}`,
        );
      } else {
        console.log(`No subscription found for topic ID: ${topic.id}`);
      }
    };

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
      subscribe,
      unsubscribe,
      updateStatus,
      updateIsConnected,
      setSessionName,
    };
  })
  .views(self => ({
    get isConnected() {
      return self.status === ConnectionStatus.CONNECTED;
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.initializeClient();
    },
  }));
export interface Mqtt extends Instance<typeof MqttStore> {}
export interface MqttSnapshotOut extends SnapshotOut<typeof MqttStore> {}
export interface MqttSnapshotIn extends SnapshotIn<typeof MqttStore> {}
