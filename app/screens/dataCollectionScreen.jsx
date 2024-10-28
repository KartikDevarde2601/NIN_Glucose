import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, SafeAreaView, Alert} from 'react-native';
import {Card, Text, Button} from 'react-native-paper';
import GraphScreen from '../components/graph';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {Theme} from '../theme/theme';
import {loadString} from '../utils/storage';
import MqttClient, {
  ConnectionOptions,
  ClientEvent,
} from '@ko-developerhong/react-native-mqtt';
import {
  addTemperature,
  addGlucose,
  addGsr,
} from '../redux/features/sensorSlice';
import {addBio} from '../redux/features/graphSlice';
import {sensorRepository} from '../op-sqllite/sensorRepository';
import {TABLE} from '../op-sqllite/db_table';

const options = {
  clientId: 'myClientId',
  cleanSession: true,
  keepAlive: 60,
  timeout: 60,
  maxInFlightMessages: 1,
  autoReconnect: true,
  protocol: 'mqtt',
};

const DataCollectionScreen = ({route}) => {
  const [IP, setIP] = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const sensor = new sensorRepository();

  // Use refs to store interval IDs to persist values across renders
  const intervalIdTemp = useRef(null);
  const intervalIdGsr = useRef(null);
  const intervalIdGlu = useRef(null);

  const dispatch = useAppDispatch();
  const temperature = useAppSelector(state => state.sensor.temperature);
  const glucose = useAppSelector(state => state.sensor.glucose);
  const gsr = useAppSelector(state => state.sensor.gsr);

  const stringToJson = message => JSON.parse(message.toString());

  const prepareSensorData = async (raw_data, tablename) => {
    const data_json = {data: raw_data.data};
    const jsonString = JSON.stringify(data_json);
    const data = {
      time: raw_data.Ts,
      visit_id: visitId,
      config: raw_data.config,
      frequency: Number(raw_data.freq),
      data: jsonString,
    };
    await sensor.insertSensordata(data, tablename);
  };

  const handleAction = action => {
    switch (action.topic) {
      case 'TEM':
        const temp = stringToJson(action.message);
        dispatch(addTemperature(temp.data));
        prepareSensorData(temp, TABLE.temperature_data);
        break;
      case 'GSR':
        const gsr = stringToJson(action.message);
        dispatch(addGsr(gsr.data));
        prepareSensorData(gsr, TABLE.gsr_data);
        break;
      case 'GLU':
        const glu = stringToJson(action.message);
        dispatch(addGlucose(glu.data));
        prepareSensorData(glu, TABLE.glucose_data);
        break;
      case 'BIO':
        const bio = stringToJson(action.message);
        dispatch(addBio(bio.data));
        prepareSensorData(bio, TABLE.biosensor_data);
        break;
      case 'ECG':
        const ecg = stringToJson(action.message);
        break;
      default:
        Alert.alert('Unknown topic', 'Unknown topic received');
        break;
    }
  };

  useEffect(() => {
    if (route.params.visitId) {
      setVisitId(route.params.visitId);
    }
  }, [route.params.visitId]);

  const subscribeTopic = topics => {
    topics.forEach(topic => MqttClient.subscribe(topic));
  };

  const clientInt = async () => {
    console.log('Connecting to MQTT broker');
    console.log('IP: ', `mqtt://${IP}`);
    try {
      await MqttClient.connect(`mqtt://${IP.trim()}`, {});
      MqttClient.on(ClientEvent.Connect, () => {
        setIsConnected(true);
        Alert.alert('Connected', 'Connected to MQTT broker successfully');
      });
      MqttClient.on(ClientEvent.Error, error => {
        Alert.alert('Connection error', error);
      });
      MqttClient.on(ClientEvent.Disconnect, cause => {
        Alert.alert('Disconnected', cause);
      });
      MqttClient.on(ClientEvent.Message, (topic, message) => {
        handleAction({topic, message});
      });
      subscribeTopic(['BIO', 'TEM', 'GSR', 'GLU', 'CONFIG_CHANGE']);
    } catch (err) {
      console.error('Connection error: ', err);
    }
  };

  const publishMessageToTopic = (topic, message) => {
    MqttClient.publish(topic, message);
  };

  const stopInterval = () => {
    if (intervalIdGlu.current) clearInterval(intervalIdGlu.current);
    if (intervalIdGsr.current) clearInterval(intervalIdGsr.current);
    if (intervalIdTemp.current) clearInterval(intervalIdTemp.current);

    intervalIdGlu.current = null;
    intervalIdGsr.current = null;
    intervalIdTemp.current = null;
  };

  const startInterval = () => {
    if (
      !intervalIdTemp.current &&
      !intervalIdGsr.current &&
      !intervalIdGlu.current
    ) {
      intervalIdGlu.current = setInterval(() => {
        publishMessageToTopic('GLUCON', 'START');
      }, 2000);

      intervalIdGsr.current = setInterval(() => {
        publishMessageToTopic('GSRCON', 'START');
      }, 3000);

      intervalIdTemp.current = setInterval(() => {
        publishMessageToTopic('TEMCON', 'START');
      }, 4000);
    }
  };

  const start = () => {
    const unixTime = Math.floor(Date.now() / 1000);
    publishMessageToTopic('SETTIME', unixTime.toString());
    setTimeout(() => {
      publishMessageToTopic('BIOCON', 'START');
    }, 1500);
    startInterval();
  };

  useEffect(() => {
    const ip = loadString('IP');
    if (ip) {
      setIP(ip);
    } else {
      Alert.alert('IP not set', 'Please set the IP address in settings');
    }

    return () => {
      stopInterval(); // Clean up on unmount
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sensorRow}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.cardText}>
              GLU
            </Text>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {glucose.glucose}
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              {glucose.time}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.cardText}>
              TEM
            </Text>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {temperature.temperature}
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              {temperature.time}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.cardText}>
              GSR
            </Text>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {gsr.gsr}
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              {gsr.time}
            </Text>
          </Card.Content>
        </Card>
      </View>
      <Card style={styles.graphCard}>
        <Card.Content>
          <GraphScreen />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={[styles.button, {backgroundColor: Theme.colors.primary}]}
          onPress={clientInt}>
          Connect
        </Button>
        <Button
          mode="contained"
          style={[styles.button, {backgroundColor: Theme.colors.primary}]}
          onPress={start}>
          Start
        </Button>
        <Button
          mode="contained"
          style={[styles.button, {backgroundColor: Theme.colors.primary}]}
          onPress={() => {
            publishMessageToTopic('BIOCON', 'STOP');
            stopInterval();
          }}>
          Stop
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: Theme.colors.background,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: Theme.colors.surface,
  },
  graphCard: {
    borderRadius: 8,
    elevation: 4,
    backgroundColor: Theme.colors.surface,
    flex: 1,
  },
  cardText: {
    color: Theme.colors.onSurface,
  },
  cardTitle: {
    color: Theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    elevation: 2,
  },
});

export default DataCollectionScreen;
