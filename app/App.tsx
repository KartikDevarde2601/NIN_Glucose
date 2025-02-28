import 'react-native-gesture-handler';
import * as React from 'react';
import {useEffect, useMemo} from 'react';
import {PaperProvider} from 'react-native-paper';
import {StatusBar} from 'react-native';
import MainNavigator from './navigation/appNavigation';
import {Theme} from './theme/theme';
import {DatabaseProvider as WatermelonDatabaseProvider} from '@nozbe/watermelondb/react';
import {database} from './watermelodb/database';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AppState, AppStateStatus} from 'react-native';
import {DatabaseService} from './op-sqllite/databaseService';
import {useStores} from './models';

const App: React.FC = () => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);
  const {mqtt} = useStores();

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
        </PaperProvider>
      </WatermelonDatabaseProvider>
    </GestureHandlerRootView>
  );
};

export default App;
