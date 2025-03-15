import {Platform, PermissionsAndroid} from 'react-native';
import {Instance, SnapshotIn, SnapshotOut, types, flow} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  PeripheralInfo,
} from 'react-native-ble-manager';

// Constants (example UUIDs)
const SERVICE_UUID_SENSOR = '9b3333b4-8307-471b-95d1-17fa46507379';
const CHARACTERISTIC_SENSOR_DATA = '766def80-beba-45d1-bad9-4f80ceba5938';
const CHARACTERISTIC_UUID_COMMAND = 'ea8145ec-d810-471a-877e-177ce5841b63';
const CHARACTERISTIC_UUID_INTERRUPT = '9bcec788-0cba-4437-b3b0-b53f0ee37312';

export const ImpedanceBLEStoreModel = types
  .model('ImpedanceBLEStore', {
    isConnected: types.optional(types.boolean, false),
    deviceId: types.optional(types.string, ''),
    deviceName: types.optional(types.string, ''),
    connectionStatus: types.optional(types.string, 'Disconnected'),
    isScanning: types.optional(types.boolean, false),
    dataReceived: types.optional(types.array(types.number), []),
    isCollecting: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    listeners: [] as any[],
    dataListener: null as any,
  }))
  .actions(withSetPropAction)
  .views(self => ({}))
  .actions(self => {
    const checkPermissions = flow(function* checkPermissions() {
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]).then(result => {
          if (result) {
            console.debug(
              '[handleAndroidPermissions] User accepts runtime permissions android 12+',
            );
          } else {
            console.error(
              '[handleAndroidPermissions] User refuses runtime permissions android 12+',
            );
          }
        });
      } else if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(checkResult => {
          if (checkResult) {
            console.debug(
              '[handleAndroidPermissions] runtime permission Android <12 already OK',
            );
          } else {
            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then(requestResult => {
              if (requestResult) {
                console.debug(
                  '[handleAndroidPermissions] User accepts runtime permission android <12',
                );
              } else {
                console.error(
                  '[handleAndroidPermissions] User refuses runtime permission android <12',
                );
              }
            });
          }
        });
      }
      return;
    });

    const initializeBluetooth = flow(function* initializeBluetooth() {
      const state = yield BleManager.checkState();
      if (state !== 'on') {
        BleManager.enableBluetooth().then(() => {
          console.log('The bluetooth is already enabled or the user confirm');
        });
      } else {
        console.log('The user refuse to enable bluetooth');
      }
    });

    // A synchronous helper to setup event listeners.
    const setupEventListeners = () => {
      console.log('Setting up event listeners...');
      // Add event listener setup logic here.
    };

    // The main setup action which calls the others.
    const setup = flow(function* setup() {
      BleManager.start({showAlert: false});
      console.log(
        'Starting BLE Manager (BleManager.start({ showAlert: false }))',
      );
      try {
        yield checkPermissions();
        yield initializeBluetooth();
        //setupEventListeners();
        return true;
      } catch (error) {
        console.error('Setup failed:', error);
        return false;
      }
    });

    return {checkPermissions, initializeBluetooth, setupEventListeners, setup};
  });

// Extend the instance interface so that TypeScript knows about the custom actions.
export interface ImpedanceBLEStore
  extends Instance<typeof ImpedanceBLEStoreModel> {
  checkPermissions: () => Promise<void>;
  initializeBluetooth: () => Promise<void>;
  setupEventListeners: () => void;
  setup: () => Promise<boolean>;
}
export interface ImpedanceBLEStoreSnapshotOut
  extends SnapshotOut<typeof ImpedanceBLEStoreModel> {}
export interface ImpedanceBLEStoreSnapshotIn
  extends SnapshotIn<typeof ImpedanceBLEStoreModel> {}

// Create a default instance function (optionally used for dependency injection)
export const createImpedanceBLEStore = () => ImpedanceBLEStoreModel.create({});
