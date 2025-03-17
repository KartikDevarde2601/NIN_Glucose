import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {FC} from 'react';
import {
  SafeAreaView,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Appbar, Chip, Button, Surface, Icon, Divider} from 'react-native-paper';
import {useTheme} from 'react-native-paper';
import {useStores} from '../../models';
import {observer} from 'mobx-react-lite';
import {RootStackParamList} from '../../navigation/appNavigation';
import {RouteProp} from '@react-navigation/native';
import {Interval} from '../../watermelodb/models/interval';
import {database} from '../../watermelodb/database';
import Toast from 'react-native-toast-message';

import SimpleGraph from './graphBIO';
import {create_csv_andSave} from '../../utils/csvgenerator';
import {DatabaseService, OP_DB_TABLE} from '../../op-sqllite/databaseService';
import {useNavigation} from '@react-navigation/native';

const DEFAULT_WIDTH = Dimensions.get('screen').width - 50;

interface BioImpedanceScreenProps extends RootStackParamList {
  route: RouteProp<RootStackParamList, 'bioImpedance'>;
}

const BioImpedanceScreen: FC<BioImpedanceScreenProps> = observer(({route}) => {
  const {BLE, serviceManager} = useStores();
  const {impedanceService} = serviceManager;
  const navigation = useNavigation();
  const theme = useTheme();
  const _goBack = () => {
    navigation.goBack();
  };

  const [isGeneratingCsv, setIsGeneratingCsv] = useState<boolean>(false);

  const dbService = useMemo(() => DatabaseService.getInstance(), []);
  // Get visit_id from route params
  const interval_id = route.params.interval_id;

  useEffect(() => {
    const fetchInterval = async () => {
      try {
        const interval = (await database.collections
          .get('intervals')
          .find(interval_id)) as Interval;
        impedanceService.setInterval(interval);
      } catch (error) {
        console.error('Error fetching interval:', error);
      }
    };

    fetchInterval();
  }, [interval_id]);

  useEffect(() => {
    BLE.setup().then(success => {
      if (success) {
        BLE.connectToDevice('NIN_IMPEDANCE');
      }
    });
    // Cleanup function to remove listeners when component unmounts
    return () => {
      BLE.disconnectDevice();
      BLE.removeEventListeners();
      impedanceService.resetState();
    };
  }, []);

  const constructPayloadString = (interval: Interval): string => {
    const frequencies = interval?.frequencies
      ? JSON.parse(interval.frequencies)
      : null;

    const configies = interval?.configuration
      ? JSON.parse(interval.configuration)
      : null;

    const sensorType = 'bioImpedance';
    const config = configies?.configuration?.join(',') || '';
    const frequency = frequencies?.frequencies?.join(',') || '';
    const datapoints = interval?.dataPoints || '60';

    return `${sensorType}:${config}:${frequency}:${datapoints}`;
  };

  const start = useCallback(() => {
    if (impedanceService.currentInterval) {
      const payload = constructPayloadString(impedanceService.currentInterval);
      serviceManager.impedanceService.startDataCollection(payload);
    }
  }, [impedanceService.currentInterval]);

  const generator_csv = async () => {
    try {
      setIsGeneratingCsv(true);
      const configies: any = impedanceService.currentInterval?.configuration
        ? JSON.parse(impedanceService.currentInterval.configuration)
        : null;

      await create_csv_andSave(
        configies.configuration,
        impedanceService.currentInterval?.visit.id,
        impedanceService.currentInterval?.interval_tag ?? 0,
        dbService,
      );
    } finally {
      setIsGeneratingCsv(false);
    }
  };

  const _onDiscard = async (visitId: string, interval_tag: number) => {
    console.log('deleting');
    try {
      // Delete records from the bioSensor table
      const deleteQuery = `DELETE FROM ${OP_DB_TABLE.bioSensor} 
                          WHERE visit_id = ? AND interval_tag = ?`;

      await dbService.execute(deleteQuery, [visitId, interval_tag]);

      impedanceService.setImpedanceData([]);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Data has been successfully discarded',
        position: 'top',
        visibilityTime: 2000,
        autoHide: true,
        topOffset: 30,
      });

      console.log('deleted');

      // Reset states
      impedanceService.setIsDataCollecting(false);
    } catch (error) {
      console.error('Error discarding data:', error);

      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to discard data',
        position: 'top',
        visibilityTime: 2000,
        autoHide: true,
        topOffset: 30,
      });
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      {/* Header */}
      <Appbar.Header
        style={[styles.header, {backgroundColor: theme.colors.background}]}>
        <View style={styles.headerLeft}>
          <Appbar.BackAction onPress={_goBack} />
        </View>
        <Appbar.Content
          title="Bioimpedance"
          mode="center-aligned"
          style={styles.headerContent}
          titleStyle={{
            fontWeight: 'bold',
            color: theme.colors.onPrimaryContainer,
          }}
        />
        <View style={{flex: 1, flexDirection: 'row'}}>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => BLE.connectToDevice('NIN_IMPEDANCE')}>
            <Icon
              source="bluetooth"
              size={30}
              color={BLE.isConnected ? 'green' : 'red'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => serviceManager.initializeServices()}>
            <Icon
              source="access-point"
              size={30}
              color={impedanceService.isActive ? 'green' : 'red'}
            />
          </TouchableOpacity>
        </View>
      </Appbar.Header>

      {/* Divider*/}
      <Divider />
      {/* Glucose Load Chip */}
      <View>
        <View style={styles.chipContainer}>
          <Chip icon="clock-time-eight" mode="outlined" style={styles.chip}>
            {impedanceService.currentInterval
              ? `${impedanceService.currentInterval.interval_tag}-interval`
              : 'No tag'}
          </Chip>
          <Chip
            icon={
              impedanceService.isCompleted
                ? 'check-circle'
                : impedanceService.isDataCollecting
                ? 'progress-clock'
                : 'information'
            }
            mode="outlined"
            style={styles.chip}>
            {impedanceService.isCompleted
              ? 'Completed'
              : impedanceService.isDataCollecting
              ? 'Collecting'
              : 'Not Started'}
          </Chip>
          <Chip icon="clock-time-eight" mode="outlined" style={styles.chip}>
            {BLE.connectionStatus}
          </Chip>
        </View>
      </View>

      {/* Graph Containers */}
      <View style={styles.graphsWrapper}>
        <Surface style={styles.graphContainer} elevation={2}>
          <SimpleGraph
            data={impedanceService.latestImpedanceData?.map(
              point => point.bioImpedance,
            )}
            title="BioImpedance"
            graphColor="#ff6b6b"
            formatYLabel={v => `$${v.toFixed(2)}`}
            formatXLabel={i => `${i}`}
          />
        </Surface>
        <Surface style={styles.graphContainer} elevation={2}>
          <SimpleGraph
            data={impedanceService.latestImpedanceData?.map(
              point => point.phaseAngle,
            )}
            title="PhaseAngel"
            graphColor="#ff6b6b"
            formatYLabel={v => `$${v.toFixed(2)}`}
            formatXLabel={i => `${i}`}
          />
        </Surface>
      </View>
      {/* Control Buttons */}
      <View style={[styles.buttonContainer]}>
        <Button
          onPress={() => start()}
          mode="contained"
          icon="play"
          style={styles.button}
          buttonColor="#4CAF50">
          Start
        </Button>
        <Button
          onPress={() => console.log('stop')}
          mode="contained"
          icon="stop"
          style={styles.button}
          buttonColor="#F44336">
          Stop
        </Button>
        <Button
          mode="outlined"
          onPress={() =>
            _onDiscard(
              impedanceService.currentInterval?.visit.id,
              impedanceService.currentInterval?.interval_tag!!,
            )
          }
          icon="delete"
          style={styles.button}>
          Discard
        </Button>
        <Button
          onPress={() => generator_csv()}
          mode="contained"
          icon="check"
          style={styles.button}
          buttonColor="#2196F3"
          loading={isGeneratingCsv}
          disabled={isGeneratingCsv}>
          {isGeneratingCsv ? 'Generating...' : 'Generate CSV'}
        </Button>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '',
  },
  chipContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#fff',
  },
  graphsWrapper: {
    paddingHorizontal: 16,
    gap: 16,
  },
  graphContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    position: 'absolute',
    top: 8,
    left: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  graphPlaceholder: {
    fontSize: 16,
    color: '#757575',
  },
  graphDimensions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  dimensionText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  button: {
    minWidth: (DEFAULT_WIDTH - 32) / 2,
    margin: 4,
  },
  header: {
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerContent: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
});

export default BioImpedanceScreen;
