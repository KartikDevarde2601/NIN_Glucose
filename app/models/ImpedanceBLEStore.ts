import {Platform, PermissionsAndroid} from 'react-native';
import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import BleManager from 'react-native-ble-manager';
import {NativeEventEmitter, NativeModules} from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const BLEStoreModel = types
  .model('BLE', {
    isConnected: types.optional(types.boolean, false),
    deviceId: types.optional(types.string, ''),
    deviceName: types.optional(types.string, ''),
    connectionStatus: types.optional(types.string, 'Disconnected'),
    isScanning: types.optional(types.boolean, false),
    isCollecting: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    listeners: [] as any[],
    dataListener: null as any,
  }))
  .actions(withSetPropAction)
  .actions(self => {
    // Add an action to remove all listeners.
    const removeEventListeners = () => {
      console.log('Removing all event listeners...');
      self.listeners.forEach((listener: any) => {
        listener.remove();
      });
      self.listeners = [];
    };

    // Convert connectToDevice to a regular async function.
    const connectToDevice = async (targetDeviceName: string) => {
      try {
        console.log('Scanning for device...');
        BleManager.scan([], 5, true);
        self.setProp('isScanning', true);
        self.setProp('connectionStatus', 'Scanning...');

        const discoveryListener = bleManagerEmitter.addListener(
          'BleManagerDiscoverPeripheral',
          async ({id, name, advertising}) => {
            const discoveredName = name || advertising?.localName || null;

            if (discoveredName === targetDeviceName) {
              console.log(`Found device: ${name}, connecting...`);
              BleManager.stopScan();
              discoveryListener.remove();

              await BleManager.connect(id);
              console.log(`Connected to: ${name}`);

              await BleManager.retrieveServices(id);
              console.log('Services retrieved');

              if (Platform.OS === 'android') {
                await BleManager.requestMTU(id, 251);
                console.log('MTU set');
              }
              // Use setProp to update state
              self.setProp('isConnected', true);
              self.setProp('deviceId', id);
              self.setProp('connectionStatus', `Connected to ${name}`);
            }
          },
        );
        // Optionally store the discovery listener if you want to remove it later
        self.listeners.push(discoveryListener);

        // Stop scanning after 5 seconds if device isn't found
        setTimeout(() => {
          BleManager.stopScan();
          discoveryListener.remove();
          self.setProp('isScanning', false);
        }, 5000);
      } catch (error) {
        console.error('Connection error:', error);
        self.setProp('isConnected', false);
        self.setProp('connectionStatus', 'Connection failed');
      }
    };

    const checkPermissions = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 31) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
          console.log('Permissions:', result);
        } else if (Platform.OS === 'android' && Platform.Version >= 23) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission granted');
          } else {
            console.warn('Location permission denied');
          }
        }
      } catch (error) {
        console.error('Permission check failed:', error);
      }
    };

    const initializeBluetooth = async () => {
      try {
        const state = await BleManager.checkState();
        if (state !== 'on') {
          await BleManager.enableBluetooth();
          console.log('Bluetooth enabled');
        } else {
          console.log('Bluetooth already enabled');
        }
      } catch (error) {
        console.error('Failed to enable Bluetooth:', error);
      }
    };

    // Disconnect function to disconnect from the BLE device
    const disconnectDevice = async () => {
      try {
        if (self.isConnected && self.deviceId) {
          await BleManager.disconnect(self.deviceId);
          console.log(`Disconnected from device: ${self.deviceId}`);
          self.setProp('isConnected', false);
          self.setProp('connectionStatus', 'Disconnected');
          self.setProp('deviceId', '');
        } else {
          console.log('No device is connected');
        }
      } catch (error) {
        console.error('Error disconnecting device:', error);
      }
    };

    const setupEventListeners = () => {
      console.log('Setting up event listeners...');
      const disconnectListener = bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        ({peripheral}) => {
          console.log(`Device disconnected: ${peripheral}`);
          self.setProp('isConnected', false);
          self.setProp('connectionStatus', 'Disconnected');
        },
      );
      self.listeners.push(disconnectListener);
    };

    const setup = async () => {
      try {
        BleManager.start({showAlert: false});
        console.log('BLE Manager started');
        await checkPermissions();
        await initializeBluetooth();
        setupEventListeners();
        return true;
      } catch (error) {
        console.error('Setup failed:', error);
        return false;
      }
    };

    return {
      connectToDevice,
      checkPermissions,
      initializeBluetooth,
      setupEventListeners,
      setup,
      removeEventListeners,
      disconnectDevice,
    };
  });

export interface ImpedanceBLEStore extends Instance<typeof BLEStoreModel> {
  checkPermissions: () => Promise<void>;
  initializeBluetooth: () => Promise<void>;
  setupEventListeners: () => void;
  setup: () => Promise<boolean>;
}

export interface BLEStoreSnapshotOut
  extends SnapshotOut<typeof BLEStoreModel> {}

export interface BLEStoreSnapshotIn extends SnapshotIn<typeof BLEStoreModel> {}

export const createImpedanceBLEStore = () => BLEStoreModel.create({});
