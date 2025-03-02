import React, {useState} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {
  Surface,
  Text,
  Card,
  Divider,
  Avatar,
  IconButton,
  Portal,
  Modal,
  SegmentedButtons,
  TextInput,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {withObservables} from '@nozbe/watermelondb/react';
import {database} from '../watermelodb/database';
import {Visit} from '../watermelodb/models/visit';
import {Interval} from '../watermelodb/models/interval';
import {Q} from '@nozbe/watermelondb';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {TableName} from '../watermelodb/schema';
import {differenceInMinutes} from 'date-fns';
import {RootStackParamList} from '../navigation/appNavigation';

interface IntervalListScreenProps {
  visit: Visit;
  intervals: Interval[];
}

interface VisitHistoryCardProps {
  intervals: Interval[];
  onPressAdd: () => void;
  onPressVisit: (interval: Interval) => void;
}

interface AddIntervalModalProps {
  visible: boolean;
  onDismiss: () => void;
  visit: Visit;
}

const AddIntervalModal: React.FC<AddIntervalModalProps> = ({
  visible,
  onDismiss,
  visit,
}) => {
  const calculateMinuteDifference = (isoString: string) => {
    const now = new Date();
    const timestamp = new Date(isoString);
    return differenceInMinutes(now, timestamp).toString();
  };

  const [numberofDataPoint, setnumberofDataPoint] = useState<string>('');
  const [intervalType, setIntervalType] = useState('BioImpedance');
  const [selectedConfig, setSelectedConfig] = useState<string[]>([]);
  const [count, setCount] = useState(
    calculateMinuteDifference(visit.visitDate),
  );
  const [frequency, setFrequency] = useState('');
  const [frequencies, setFrequencies] = useState<string[]>([]);

  const handleAddFrequency = () => {
    if (frequency && !frequencies.includes(frequency)) {
      setFrequencies([...frequencies, frequency]);
      setFrequency('');
    }
  };

  const handleRemoveFrequency = (freq: string) => {
    setFrequencies(frequencies.filter(f => f !== freq));
  };

  const handleSubmit = async () => {
    const frequencyData = {
      frequencies: frequencies,
    };

    const configurationData = {
      configuration: selectedConfig,
    };

    try {
      const IntervalCollection = database.get<Interval>(TableName.INTERVALS);
      await database.write(async () => {
        await IntervalCollection.create(interval => {
          interval.visit.set(visit);
          interval.interval_tag = Number(count);
          interval.intervalType = intervalType;
          interval.dataPoints = Number(numberofDataPoint);
          interval.frequencies = JSON.stringify(frequencyData);
          interval.configuration = JSON.stringify(configurationData);
        });
      });
      onDismiss(); // Close modal after saving
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}>
        <Card
          style={[
            styles.modalCard,
            !visible && {elevation: 0, shadowOpacity: 0},
          ]}>
          <Card.Title title="Add New Interval" />
          <Card.Content>
            <SegmentedButtons
              value={intervalType}
              onValueChange={setIntervalType}
              buttons={[
                {value: 'BioImpedance', label: 'BioImpedance'},
                {value: 'ECG-Other', label: 'ECG & Other'},
              ]}
              style={styles.segmentedButtons}
            />
            <TextInput
              mode="outlined"
              label="Interval tag"
              value={count}
              onChangeText={setCount}
              style={styles.notesInput}
            />
            <TextInput
              mode="outlined"
              label="Number of Data points"
              value={numberofDataPoint}
              onChangeText={setnumberofDataPoint}
              style={styles.notesInput}
            />
            <SegmentedButtons
              multiSelect
              value={selectedConfig}
              onValueChange={setSelectedConfig}
              style={styles.segmentedButtons}
              buttons={[
                {
                  labelStyle: styles.segmentedButtonLabel,
                  style: styles.ConfigSegmentButton,
                  value: 'UPPERBODY',
                  label: 'Upper Body',
                  showSelectedCheck: true,
                },
                {
                  labelStyle: styles.segmentedButtonLabel,
                  style: styles.ConfigSegmentButton,
                  value: 'LOWERBODY',
                  label: 'Lower Body',
                  showSelectedCheck: true,
                },
                {
                  labelStyle: styles.segmentedButtonLabel,
                  style: styles.ConfigSegmentButton,
                  value: 'LEFTBODY',
                  label: 'Left Body',
                  showSelectedCheck: true,
                },
              ]}
            />
            <SegmentedButtons
              multiSelect
              value={selectedConfig}
              onValueChange={setSelectedConfig}
              style={styles.segmentedButtons}
              buttons={[
                {
                  labelStyle: styles.segmentedButtonLabel,
                  style: styles.ConfigSegmentButton,
                  value: 'RIGHTBODY',
                  label: 'Right Body',
                  showSelectedCheck: true,
                },
                {
                  labelStyle: styles.segmentedButtonLabel,
                  style: styles.ConfigSegmentButton,
                  value: 'FULLBODY',
                  label: 'Full Body',
                  showSelectedCheck: true,
                },
              ]}
            />
            <View
              style={[
                styles.chipContainer,
                {paddingHorizontal: frequencies.length < 0 ? 0 : 10},
              ]}>
              {frequencies.map(item => (
                <Chip
                  key={item}
                  style={styles.chip}
                  onClose={() => handleRemoveFrequency(item)}>
                  {item}
                </Chip>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                mode="outlined"
                label="Frequency"
                value={frequency}
                onChangeText={setFrequency}
                style={styles.input}
                keyboardType="numeric"
              />
              <Button
                mode="outlined"
                onPress={handleAddFrequency}
                style={styles.button}>
                Add
              </Button>
            </View>
            <View style={styles.buttonContainer}>
              <Button mode="outlined" onPress={onDismiss} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}>
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const VisitHistoryCard: React.FC<VisitHistoryCardProps> = ({
  intervals,
  onPressAdd,
  onPressVisit,
}) => {
  const theme = useTheme();
  return (
    <Card style={[styles.card, {flex: 1}]}>
      <Card.Title
        title="Visit History"
        left={props => <Avatar.Icon {...props} icon="calendar-clock" />}
        right={props => (
          <IconButton
            {...props}
            icon="plus"
            onPress={onPressAdd}
            mode="contained"
            style={styles.addButton}
          />
        )}
      />
      <FlatList
        data={intervals}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            Patient has not collected data at any interval.
          </Text>
        )}
        scrollEnabled={true}
        nestedScrollEnabled
        renderItem={({item}) => (
          <View style={styles.visitItemWrapper}>
            <Card style={styles.visitCard} mode="outlined">
              <Card.Content>
                <View style={styles.row}>
                  <View style={{flexDirection: 'row', gap: 10}}>
                    <Avatar.Icon icon="timer-sand" size={25} />
                    <Text variant="titleMedium">{item.interval_tag} Tag</Text>
                  </View>
                  <Chip style={styles.chip}>{item.intervalType}</Chip>
                </View>
                <Divider style={styles.miniDivider} />
                <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 10,
                      gap: 5,
                    }}>
                    {JSON.parse(item.configuration).configuration.map(
                      (config: string) => (
                        <Chip
                          textStyle={{fontSize: 12}}
                          key={config}
                          style={styles.chipConfig}
                          mode="outlined">
                          {config.toLocaleLowerCase()}
                        </Chip>
                      ),
                    )}
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    onPress={() => onPressVisit(item)}
                  />
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
      />
    </Card>
  );
};

const IntervalListScreen: React.FC<IntervalListScreenProps> = ({
  visit,
  intervals,
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleOnClickVisit = (interval: Interval) => {
    if (interval.intervalType == 'BioImpedance') {
      navigation.navigate('bioImpedance', {interval_id: interval.id});
    } else if (interval.intervalType == 'ECG-Other') {
      navigation.navigate('ecg', {interval_id: interval.id});
    }
  };

  return (
    <Surface style={[styles.container, {paddingBottom: insets.bottom}]}>
      <View style={{flex: 1}}>
        <VisitHistoryCard
          intervals={intervals}
          onPressAdd={() => setModalVisible(true)}
          onPressVisit={handleOnClickVisit}
        />
        <AddIntervalModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          visit={visit}
        />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 10,
    marginVertical: 10,
    elevation: 2,
  },
  modalContainer: {
    margin: 20,
  },
  modalCard: {
    elevation: 4,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 2},
  },
  dateText: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  notesInput: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  visitReason: {
    marginTop: 8,
    color: '#666',
  },
  visitItemWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  visitCard: {
    marginVertical: 4,
    borderRadius: 8,
    marginHorizontal: 0,
  },
  chip: {
    height: 30,
    paddingHorizontal: 8,
  },
  chipConfig: {
    height: 32,
  },
  miniDivider: {
    marginVertical: 4,
  },
  addButton: {
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  ConfigSegmentButton: {
    flex: 1,
  },
  segmentedButtonLabel: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  chipContainer: {
    gap: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

// Enhanced component with proper typing for withObservables
const enhanceIntervalListScreen = withObservables(
  ['route'],
  ({route}: {route: {params: {visit_id: string}}}) => ({
    visit: database.get<Visit>('visits').findAndObserve(route.params.visit_id),
    intervals: database
      .get<Interval>('intervals')
      .query(Q.where('visit_id', route.params.visit_id))
      .observe(),
  }),
);

export default enhanceIntervalListScreen(IntervalListScreen);
