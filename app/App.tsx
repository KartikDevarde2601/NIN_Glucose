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

import {useInitialRootStore} from './models';

const {ManageStorage} = NativeModules;
export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

interface AppProps {
  hideSplashScreen: () => Promise<boolean>;
}

const App: React.FC<AppProps> = (props: AppProps) => {
  const {hideSplashScreen} = props;
  const dbService = useMemo(() => DatabaseService.getInstance(), []);
  const {mqtt} = useStores();

  const {rehydrated} = useInitialRootStore(() => {
    // This runs after the root store has been initialized and rehydrated.

    // If your initialization scripts run very fast, it's good to show the splash screen for just a bit longer to prevent flicker.
    // Slightly delaying splash screen hiding for better UX; can be customized or removed as needed,
    // Note: (vanilla Android) The splash-screen will not appear if you launch your app via the terminal or Android Studio. Kill the app and launch it normally by tapping on the launcher icon. https://stackoverflow.com/a/69831106
    // Note: (vanilla iOS) You might notice the splash-screen logo change size. This happens in debug/development mode. Try building the app for release.
    setTimeout(hideSplashScreen, 500);
  });

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
          <MainNavigator />
          <Toast />
        </PaperProvider>
      </WatermelonDatabaseProvider>
    </GestureHandlerRootView>
  );
};

export default App;
