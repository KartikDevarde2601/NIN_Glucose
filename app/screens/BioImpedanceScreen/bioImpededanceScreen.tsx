import React, {useEffect, useState} from 'react';
import {FC} from 'react';
import {
  SafeAreaView,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Appbar,
  Chip,
  Button,
  Surface,
  Icon,
  Divider,
} from 'react-native-paper';
import {useTheme} from 'react-native-paper';
import {useStores} from '../../models';
import {observer} from 'mobx-react-lite';
import {useEventListeners} from '../../hook/useEventListernMqtt';
import {RootStackParamList} from '../../navigation/appNavigation';
import {RouteProp} from '@react-navigation/native';
import {Interval} from '../../watermelodb/models/interval';
import {database} from '../../watermelodb/database';
import {sensorRepository} from '../../op-sqllite/sensorRepository';
import {sensor_data} from '../../op-sqllite/sensorRepository';
import SimpleGraph from './graphBIO';
import {DataPoint} from './graphBIO';

enum MqttQos {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}

const DEFAULT_WIDTH = Dimensions.get('screen').width - 50;

interface BioImpedanceScreenProps extends RootStackParamList {
  route: RouteProp<RootStackParamList, 'bioImpedance'>;
}

const sensor = new sensorRepository();

const BioImpedanceScreen: FC<BioImpedanceScreenProps> = observer(({route}) => {
  const theme = useTheme();
  const _goBack = () => {
    console.log('back');
  };
  const {mqtt} = useStores();
  const [interval, setInterval] = useState<Interval | undefined>(undefined);
  const [numPoints, setnumPoints] = useState<DataPoint[]>([]);
  const [isSubscribe, setIsSubscribe] = useState<boolean>(false);

  // Get visit_id from route params
  const interval_id = route.params.interval_id;

  useEffect(() => {
    const fetchInterval = async () => {
      try {
        const interval = (await database.collections
          .get('intervals')
          .find(interval_id)) as Interval;
        setInterval(interval);
      } catch (error) {
        console.error('Error fetching interval:', error);
      }
    };

    fetchInterval();
  }, [interval_id]);

  useEventListeners(mqtt.client!);

  const publish = (topic: string, payload: any) => {
    const paylaod = {
      topic: topic,
      payload: payload,
    };
    mqtt.client?.publish(paylaod).then(ack => {
      console.log(`publish topic with ack ${ack}`);
    });
  };

  const constructPayloadString = (interval: Interval): string => {
    const frequencies = interval?.frequencies
      ? JSON.parse(interval.frequencies)
      : null;

    const configies = interval?.configuration
      ? JSON.parse(interval.configuration)
      : null;

    const sensorType = 'bioImpedance';
    const config = configies?.configuration?.join(',') || ''; // Convert array to comma-separated string
    const frequency = frequencies?.frequencies?.join(',') || ''; // Convert array to comma-separated string
    const datapoints = interval?.dataPoints || '100';

    return `${sensorType}:${config}:${frequency}:${datapoints}`;
  };

  const start = () => {
    if (interval) {
      const payload = constructPayloadString(interval);
      console.log(payload);
      publish('global/command_devices', payload);
    } else {
      console.log('interval is undefined');
    }
  };

  const subscribeToBIO = async () => {
    if (mqtt.client) {
      mqtt.client.subscribe({
        topic: 'nin/bioimpedance',
        qos: MqttQos.EXACTLY_ONCE,
        onSuccess: ack => {
          setIsSubscribe(true);
        },
        onError: error => {
          setIsSubscribe(false);
        },
        onEvent: ({payload}) => {
          const dataObject = JSON.parse(payload);
          setnumPoints(dataObject.data);

          const data: sensor_data = {
            visit_id: interval?.visit.id,
            interval_tag: interval?.interval_tag ?? 0,
            config: dataObject.config,
            frequency: dataObject.frequency,
            time: dataObject.time,
            sensor_type: dataObject.sensor_type,
            data: JSON.stringify(dataObject.data),
          };
          sensor.insertSensordata(data, 'sensor_data');
        },
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
            onPress={() => mqtt.connect()}>
            <Icon
              source="access-point"
              size={30}
              color={mqtt.isconnected ? 'green' : 'red'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => subscribeToBIO()}>
            <Icon
              source="access-point"
              size={30}
              color={isSubscribe ? 'green' : 'red'}
            />
          </TouchableOpacity>
        </View>
      </Appbar.Header>

      {/* Divider*/}
      <Divider />
      {/* Glucose Load Chip */}
      <View style={styles.chipContainer}>
        <Chip icon="pulse" mode="outlined" style={styles.chip}>
          Glucose Load
        </Chip>
        <Chip icon="clock-time-eight" mode="outlined" style={styles.chip}>
          {interval ? `${interval.interval_tag}-interval` : 'No tag'}
        </Chip>
      </View>

      {/* Graph Containers */}
      <View style={styles.graphsWrapper}>
        <Surface style={styles.graphContainer} elevation={2}>
          <SimpleGraph
            data={numPoints.map(point => point.bioImpedance)}
            title="BioImpedance"
            graphColor="#ff6b6b"
            formatYLabel={v => `$${v.toFixed(2)}`}
            formatXLabel={i => `${i} ms`}
          />
        </Surface>
        <Surface style={styles.graphContainer} elevation={2}>
          <SimpleGraph
            data={numPoints.map(point => point.phaseAngle)}
            title="PhaseAngel"
            graphColor="#ff6b6b"
            formatYLabel={v => `$${v.toFixed(2)}`}
            formatXLabel={i => `${i} ms`}
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
          mode="contained"
          icon="stop"
          style={styles.button}
          buttonColor="#F44336">
          Stop
        </Button>
        <Button mode="outlined" icon="delete" style={styles.button}>
          Discard
        </Button>
        <Button
          mode="contained"
          icon="check"
          style={styles.button}
          buttonColor="#2196F3">
          Done
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
    gap: 16,
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
