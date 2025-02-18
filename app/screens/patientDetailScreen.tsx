import React, {FC, useState} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {
  Card,
  Text,
  Divider,
  List,
  Avatar,
  Chip,
  Button,
  IconButton,
  Portal,
  SegmentedButtons,
  TextInput,
  Modal,
} from 'react-native-paper';
import {withObservables} from '@nozbe/watermelondb/react';
import {Patient} from '../watermelodb/models/patient';
import {Clinical} from '../watermelodb/models/clinical';
import {format} from 'date-fns';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {database} from '../watermelodb/database';
import {Q, tableName} from '@nozbe/watermelondb';
import {TableName} from '../watermelodb/schema';
import {Visit} from '../watermelodb/models/visit';
import {SafeAreaView} from 'react-native';

type PatientDetailsProps = {
  patient: Patient;
  clinical: Clinical[];
  visits: Visit[];
};

export type RootStackParamList = {
  hometabs: undefined;
  patientDetail: {patientId: string};
  addClinicalData: {patientId: string};
};

const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80)
    return {label: 'Normal', color: 'green'};
  if (systolic < 130 && diastolic < 80)
    return {label: 'Elevated', color: 'orange'};
  return {label: 'High', color: 'red'};
};

const InfoItem = ({
  label,
  value,
  fullWidth = false,
  iconName,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
  iconName?: string;
}) => (
  <View style={[styles.infoItem, fullWidth && styles.fullWidth]}>
    <Text variant="bodyMedium" style={styles.label}>
      {label}
    </Text>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      {iconName && (
        <Avatar.Icon
          size={25}
          icon={iconName}
          style={{marginRight: 8, backgroundColor: 'transparent'}}
          color={styles.label.color}
        />
      )}
      <Text variant="bodyLarge" style={styles.value}>
        {value}
      </Text>
    </View>
  </View>
);

const BasicInfoCard = ({patient}: {patient: Patient}) => {
  const [showBasicInfoDetails, setShowBasicInfoDetails] = useState(false);
  return (
    <Card style={styles.card}>
      <Card.Title
        title={patient.fullName}
        subtitle={patient.email}
        left={props => <Avatar.Icon {...props} icon="account" />}
        right={props => (
          <Button
            {...props}
            onPress={() => setShowBasicInfoDetails(!showBasicInfoDetails)}
            compact
            mode="text"
            style={{marginRight: 16}}>
            {showBasicInfoDetails ? 'Less' : 'More'}
          </Button>
        )}
      />
      <Card.Content>
        {showBasicInfoDetails ? (
          <View style={styles.infoGrid}>
            <InfoItem
              label="Age"
              value={`${patient.age} years`}
              iconName="baby-face"
            />
            <InfoItem
              label="Gender"
              value={patient.gender}
              iconName="gender-male-female"
            />
            <InfoItem
              label="Height"
              value={`${patient.height} cm`}
              iconName="human-male-height"
            />
            <InfoItem
              label="Weight"
              value={`${patient.weight} kg`}
              iconName="weight-kilogram"
            />
            <InfoItem
              label="Email"
              value={patient.email}
              fullWidth
              iconName="email"
            />
            <InfoItem
              label="Contact"
              value={patient.contactInformation}
              fullWidth
              iconName="phone"
            />
          </View>
        ) : (
          <View style={styles.infoGrid}>
            <InfoItem
              label="Age"
              value={`${patient.age} years`}
              iconName="baby-face"
            />
            <InfoItem
              label="Gender"
              value={patient.gender}
              iconName="gender-male-female"
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const ClinicalInfoCard = ({clinical}: {clinical: Clinical}) => {
  const [showClinicalInfoDetails, setShowClinicalInfoDetails] = useState(false);
  return (
    <Card style={styles.card}>
      <Card.Title
        title="Clinical Information"
        left={props => <Avatar.Icon {...props} icon="medical-bag" />}
        right={props => (
          <Button
            {...props}
            onPress={() => setShowClinicalInfoDetails(!showClinicalInfoDetails)}
            compact
            mode="text"
            style={{marginRight: 16}}>
            {showClinicalInfoDetails ? 'Less' : 'More'}
          </Button>
        )}
      />
      <Card.Content>
        {showClinicalInfoDetails ? (
          <>
            <View style={styles.clinicalHeader}>
              <Chip icon="water" mode="outlined" style={styles.chip}>
                Blood: {clinical.bloodGroup}
              </Chip>
              <Chip
                icon="heart-pulse"
                mode="outlined"
                style={styles.chip}
                textStyle={{
                  color: getBPStatus(clinical.systolic, clinical.diastolic)
                    .color,
                }}>
                BP: {clinical.systolic}/{clinical.diastolic}
              </Chip>
              <Chip icon="thermometer" mode="outlined" style={styles.chip}>
                Temp: {clinical.temperature}°C
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <List.Section>
              <List.Subheader>Lifestyle Information</List.Subheader>
              {clinical.smokingType && (
                <List.Item
                  title="Smoking History"
                  description={`${clinical.smokingType} - ${clinical.overAllYearOfSmoking} years\nDaily: ${clinical.dailyConsumption} cigarettes`}
                  left={props => <List.Icon {...props} icon="smoking" />}
                />
              )}
              {clinical.alcoholType && (
                <List.Item
                  title="Alcohol Consumption"
                  description={`${clinical.alcoholType}\nFree days: ${clinical.alcoholFreeDays}`}
                  left={props => <List.Icon {...props} icon="glass-wine" />}
                />
              )}
            </List.Section>

            <Divider style={styles.divider} />

            <List.Section>
              <List.Subheader>Medical History</List.Subheader>
              <List.Item
                title="Recent Health Issues"
                description={clinical.reacentHealthIssue || 'None reported'}
                left={props => <List.Icon {...props} icon="hospital" />}
              />
              <List.Item
                title="Hereditary History"
                description={clinical.hereditaryHistory || 'None reported'}
                left={props => <List.Icon {...props} icon="dna" />}
              />
            </List.Section>
          </>
        ) : (
          <View style={styles.clinicalHeader}>
            <Chip icon="water" mode="outlined" style={styles.chip}>
              Blood: {clinical.bloodGroup}
            </Chip>
            <Chip
              icon="heart-pulse"
              mode="outlined"
              style={styles.chip}
              textStyle={{
                color: getBPStatus(clinical.systolic, clinical.diastolic).color,
              }}>
              BP: {clinical.systolic}/{clinical.diastolic}
            </Chip>
            {clinical.smokingType && (
              <Chip icon="smoking" mode="outlined" style={styles.chip}>
                Smoke: {clinical.smokingType}
              </Chip>
            )}
            {clinical.alcoholType && (
              <Chip icon="glass-wine" mode="outlined" style={styles.chip}>
                Alcohol: {clinical.alcoholType}
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

interface VisitHistoryCardProps {
  visits: Visit[];
  onPressAdd: () => void;
}

const VisitHistoryCard: React.FC<VisitHistoryCardProps> = ({
  visits,
  onPressAdd,
}) => {
  return (
    <Card style={styles.card}>
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
        data={visits}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        nestedScrollEnabled
        renderItem={({item}) => (
          <View style={styles.visitItemWrapper}>
            <Card style={styles.visitCard} mode="outlined">
              <Card.Content>
                <View style={styles.row}>
                  <View style={{flexDirection: 'row', gap: 10}}>
                    <Avatar.Icon icon="calendar-clock" size={25} />
                    <Text variant="titleMedium">
                      {format(new Date(item.visitDate), 'MMM d, yyyy')}
                    </Text>
                  </View>

                  <Chip style={styles.chip}>{item.visitType}</Chip>
                </View>
                <Divider style={styles.miniDivider} />
                {item.visitNotes && (
                  <Text variant="bodySmall" style={styles.visitReason}>
                    {item.visitNotes}
                  </Text>
                )}
              </Card.Content>
            </Card>
          </View>
        )}
      />
    </Card>
  );
};

interface AddVisitModalProps {
  visible: boolean;
  onDismiss: () => void;
  patient: Patient;
}

const AddVisitModal: React.FC<AddVisitModalProps> = ({
  visible,
  onDismiss,
  patient,
}) => {
  const [visitNotes, setVisitNotes] = useState('');
  const [visitType, setVisitType] = useState('glucose');
  const currentDate = new Date().toISOString();

  const handleSubmit = async () => {
    try {
      const visitsCollection = database.get<Visit>(TableName.VISITS);
      await database.write(async () => {
        await visitsCollection.create(visit => {
          visit.patient.set(patient);
          visit.visitDate = new Date().toISOString();
          visit.visitNotes = visitNotes;
          visit.visitType = visitType;
        });
      });
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
        <Card>
          <Card.Title title="Add New Visit" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.dateText}>
              Date: {format(new Date(currentDate), 'MMM d, yyyy')}
            </Text>

            <SegmentedButtons
              value={visitType}
              onValueChange={setVisitType}
              buttons={[
                {value: 'glucose', label: 'Glucose Load'},
                {value: 'water', label: 'Water Load'},
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              mode="outlined"
              label="Visit Notes"
              value={visitNotes}
              onChangeText={setVisitNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />

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

const PatientDetailsScreen: FC<PatientDetailsProps> = ({
  patient,
  clinical,
  visits,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const sections = [
    {key: 'basic', component: <BasicInfoCard patient={patient} />},
    {key: 'clinical', component: <ClinicalInfoCard clinical={clinical[0]} />},
    {
      key: 'visits',
      component: (
        <VisitHistoryCard
          visits={visits}
          onPressAdd={() => setModalVisible(true)}
        />
      ),
    },
  ];

  return (
    <SafeAreaView style={{flex: 1}}>
      <FlatList
        data={sections}
        renderItem={({item}) => item.component}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.contentContainer}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      />
      <AddVisitModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        patient={patient}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  fullWidth: {
    minWidth: '100%',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontWeight: '500',
  },
  clinicalHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    height: 36,
  },
  divider: {
    marginVertical: 12,
  },
  miniDivider: {
    marginVertical: 4,
  },
  addButton: {
    marginRight: 8,
  },
  modalContainer: {
    margin: 20,
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
    paddingVertical: 4, // Added internal spacing
  },
  visitReason: {
    marginTop: 8, // Increased from 4
    color: '#666',
  },
  visitItemWrapper: {
    paddingHorizontal: 16, // Directly control horizontal spacing
    paddingVertical: 4,
  },
  visitCard: {
    marginVertical: 4,
    borderRadius: 8,
    // Remove any fixed width or conflicting margins
    marginHorizontal: 0, // Reset horizontal margins
  },
  visitCardContent: {
    paddingHorizontal: 16, // Add inner padding to card content
  },
});

const EnhancePatientDetailsScreen = withObservables(
  ['route'],
  ({route}: {route: RouteProp<RootStackParamList, 'patientDetail'>}) => ({
    patient: database.collections
      .get<Patient>(TableName.PATIENTS)
      .findAndObserve(route.params.patientId),
    clinical: database.collections
      .get<Clinical>(TableName.CLINICALS)
      .query(Q.where('patient_id', route.params.patientId))
      .observe(),
    visits: database.collections
      .get<Visit>(TableName.VISITS)
      .query(Q.where('patient_id', route.params.patientId)),
  }),
)(PatientDetailsScreen);

export default EnhancePatientDetailsScreen;
