import 'react-native-gesture-handler';
import * as React from 'react';
import {useEffect, useMemo} from 'react';
import {PaperProvider} from 'react-native-paper';
import {StatusBar, Platform, PermissionsAndroid, Alert} from 'react-native';
import MainNavigator from './navigation/appNavigation';
import {Theme} from './theme/theme';
import {DatabaseProvider as WatermelonDatabaseProvider} from '@nozbe/watermelondb/react';
import {database} from './watermelodb/database';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DatabaseService} from './op-sqllite/databaseService';
import {useStores} from './models';
import Toast from 'react-native-toast-message';
import {NativeModules} from 'react-native';

const {ManageStorage} = NativeModules;

const App: React.FC = () => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);
  const {mqtt} = useStores();

  const requestStoragePermissions = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        const result =
          await ManageStorage.requestManageExternalStoragePermission();
        console.log(result);
        if (result === 'Permission already granted') {
          console.log('Storage permissions granted');
        } else {
          Alert.alert(
            'Permission Requested',
            'Please grant the manage external storage permission.',
          );
        }
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        if (
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Storage permissions granted');
          Alert.alert('Permission Granted', 'You have storage permissions.');
        } else {
          console.log('Storage permissions denied');
          Alert.alert(
            'Permission Denied',
            'Cannot proceed without storage permissions.',
          );
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestStoragePermissions();
  });

  useEffect(() => {
    try {
      dbService.initDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }

    return () => {
      try {
        dbService.close();
      } catch (error) {
        console.error('Failed to close database:', error);
      }
    };
  }, [dbService]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <WatermelonDatabaseProvider database={database}>
        <PaperProvider theme={Theme}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="rgb(120, 69, 172)"
          />
          <Toast />
          <MainNavigator />
        </PaperProvider>
      </WatermelonDatabaseProvider>
    </GestureHandlerRootView>
  );
};

export default App;
