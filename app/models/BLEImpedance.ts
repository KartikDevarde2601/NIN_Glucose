import {
  Instance,
  SnapshotIn,
  SnapshotOut,
  types,
  flow,
  getParent,
} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import {RootStore} from './RootStore';
import BleManager, {
  BleManagerDidUpdateValueForCharacteristicEvent,
} from 'react-native-ble-manager';
import {decodePayload} from '../utils/decoder';
import {Interval} from '../watermelodb/models/interval';
import {
  SensorRepository,
  BioSensorData,
  BioData,
} from '../op-sqllite/sensorRepository';

const SERVICE_UUID_SENSOR = '9b3333b4-8307-471b-95d1-17fa46507379';
const CHARACTERISTIC_SENSOR_DATA = '766def80-beba-45d1-bad9-4f80ceba5938';
const CHARACTERISTIC_UUID_COMMAND = 'ea8145ec-d810-471a-877e-177ce5841b63';
const CHARACTERISTIC_UUID_INTERRUPT = '9bcec788-0cba-4437-b3b0-b53f0ee37312';
const CHARACTERISTIC_UUID_COMPLETED = '9bcec788-0cba-beba-45d1-b53f0ee37312';
// Make sure to define this constant that's used in the code
const DATA_CHARACTERISTIC_UUID = CHARACTERISTIC_SENSOR_DATA;

const sensor = new SensorRepository();

const defaultState = {
  isActive: false,
  isDataCollecting: false,
  latestImpedanceData: [],
  isCompleted: false,
};

function stringToBytes(str: string): number[] {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

const BioPhaseDataModel = types.model('BioPhaseData', {
  bioImpedance: types.number,
  phaseAngle: types.number,
});
/**
 * Model description here for TypeScript hints.
 */
export const BLEImpedanceModel = types
  .model('BLEImpedance')
  .props({
    isActive: types.optional(types.boolean, false),
    isDataCollecting: types.optional(types.boolean, false),
    latestImpedanceData: types.optional(types.array(BioPhaseDataModel), []),
    isCompleted: types.optional(types.boolean, false),
  })
  .volatile(() => ({
    currentInterval: null as Interval | null,
  }))
  .actions(withSetPropAction)
  .views(self => ({
    get rootStore() {
      // @ts-ignore - Access service manager
      const serviceManager = getParent(self);
      // @ts-ignore - Access root store
      const rootStore = getParent(serviceManager) as RootStore;
      return rootStore;
    },

    get isReady(): boolean {
      // Now we can safely access BLE through our typed rootStore getter
      return this.rootStore.BLE.isConnected;
    },

    get deviceId(): string {
      // Use the same pattern here
      return this.rootStore.BLE.deviceId;
    },
  }))
  .actions(self => {
    const setImpedanceData = (data: SnapshotIn<typeof BioPhaseDataModel>[]) => {
      self.setProp('latestImpedanceData', data);
    };

    const setIsDataCollecting = (value: boolean) => {
      self.setProp('isDataCollecting', value);
    };

    const handleIsCompleted = (data: number[]) => {
      const receivedValue = data[0];
      if (receivedValue === 0x01) {
        self.setProp('isCompleted', true);
      }
    };

    const handleImpedanceData = (data: number[]) => {
      const payload = decodePayload(data);
      if (self.currentInterval != null) {
        const dbformat: BioSensorData[] =
          payload.data?.map((value: BioData) => ({
            time: Date.now(),
            visit_id: self.currentInterval!.visit.id,
            interval_tag: self.currentInterval!.interval_tag,
            config: payload.config,
            frequency: payload.freq,
            bioImpedance: value.bioImpedance,
            phaseAngle: value.phaseAngle,
          })) || [];

        if (dbformat.length > 0) {
          sensor.bulkInsertBioSensorData(dbformat);
        }
        setImpedanceData(payload.data);
      }
    };

    // Set the isActive flag
    const setIsActive = (active: boolean) => {
      self.setProp('isActive', active);
    };

    const setupDataNotificationListener = (): void => {
      // @ts-ignore - Access service manager
      const serviceManager = getParent(self);
      // @ts-ignore - Access root store
      const rootStore = getParent(serviceManager) as RootStore;

      rootStore.BLE.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({
          peripheral,
          characteristic,
          value,
        }: BleManagerDidUpdateValueForCharacteristicEvent) => {
          if (characteristic === DATA_CHARACTERISTIC_UUID) {
            handleImpedanceData(value);
          } else if (characteristic === CHARACTERISTIC_UUID_COMPLETED) {
            handleIsCompleted(value);
          }
        },
      );
    };

    const setInterval = (interval: Interval) => {
      self.currentInterval = interval;
    };

    const resetState = () => {
      self.setProp('isActive', defaultState.isActive);
      self.setProp('isDataCollecting', defaultState.isDataCollecting);
      self.setProp('latestImpedanceData', defaultState.latestImpedanceData);
      self.setProp('isCompleted', defaultState.isCompleted);
    };

    return {
      // Initialize the service after connection
      initialize: flow(function* () {
        if (!self.isReady) {
          throw new Error('BLE device not connected');
        }

        try {
          // Setup notification listener for data characteristic
          setupDataNotificationListener();

          setIsActive(true);
          return true;
        } catch (error) {
          console.error('Failed to initialize impedance service:', error);
          return false;
        }
      }),

      // Start collecting impedance data
      startDataCollection: flow(function* (payload: string) {
        if (!self.isReady || !self.isActive) {
          throw new Error('Service not ready or not active');
        }

        if (self.isDataCollecting) {
          return true;
        }

        try {
          yield BleManager.startNotification(
            self.deviceId,
            SERVICE_UUID_SENSOR,
            DATA_CHARACTERISTIC_UUID,
          );

          yield BleManager.startNotification(
            self.deviceId,
            SERVICE_UUID_SENSOR,
            CHARACTERISTIC_UUID_COMPLETED,
          );

          const bytes = stringToBytes(payload);
          yield BleManager.write(
            self.deviceId,
            SERVICE_UUID_SENSOR,
            CHARACTERISTIC_UUID_COMMAND,
            Array.from(bytes),
            bytes.length,
          );

          setIsDataCollecting(true);

          return true;
        } catch (error) {
          console.error('Failed to start impedance data collection:', error);
          return false;
        }
      }),

      // Stop collecting impedance data
      stopDataCollection: flow(function* () {
        if (!self.isDataCollecting) {
          return true;
        }

        try {
          // Send command to stop data collection
          const stopCommand = [0x00]; // Example command, replace with your protocol
          yield BleManager.write(
            self.deviceId,
            SERVICE_UUID_SENSOR,
            CHARACTERISTIC_UUID_INTERRUPT,
            stopCommand,
            stopCommand.length,
          );

          // Stop notification for the data characteristic
          yield BleManager.stopNotification(
            self.deviceId,
            SERVICE_UUID_SENSOR,
            DATA_CHARACTERISTIC_UUID,
          );
          return true;
        } catch (error) {
          console.error('Failed to stop impedance data collection:', error);
          return false;
        }
      }),

      setupDataNotificationListener,
      handleImpedanceData,
      setIsActive,
      resetState,
      setInterval,
      setImpedanceData,
      setIsDataCollecting,
    };
  });

export interface BLEImpedance extends Instance<typeof BLEImpedanceModel> {}
export interface BLEImpedanceSnapshotOut
  extends SnapshotOut<typeof BLEImpedanceModel> {}
export interface BLEImpedanceSnapshotIn
  extends SnapshotIn<typeof BLEImpedanceModel> {}
export const createBLEImpedanceDefaultModel = () =>
  types.optional(BLEImpedanceModel, {});
