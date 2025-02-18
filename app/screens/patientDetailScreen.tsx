import React, {FC, useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {
  Card,
  Text,
  Divider,
  List,
  Avatar,
  Chip,
  useTheme,
  Button,
} from 'react-native-paper';
import {withObservables} from '@nozbe/watermelondb/react';
import {Patient} from '../watermelodb/models/patient';
import {Clinical} from '../watermelodb/models/clinical';
import {format} from 'date-fns';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {database} from '../watermelodb/database';
import {Q} from '@nozbe/watermelondb';
import {TableName} from '../watermelodb/schema';

// Constants (Consider moving these to a separate config file if used elsewhere)
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const smokingTypes = ['Never', 'Former', 'Current', 'Passive'];
const alcoholTypes = ['Never', 'Occasional', 'Regular', 'Former'];

type PatientDetailsProps = {
  patient: Patient;
  clinical: Clinical[];
};

export type RootStackParamList = {
  hometabs: undefined;
  patientDetail: {patientId: string};
  addClinicalData: {patientId: string};
};

// Helper function to determine BP status (can be moved to utils if needed elsewhere)
const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80)
    return {label: 'Normal', color: 'green'};
  if (systolic < 130 && diastolic < 80)
    return {label: 'Elevated', color: 'orange'};
  return {label: 'High', color: 'red'};
};

// Reusable InfoItem Component
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

// BasicInfoCard Component
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

// ClinicalInfoCard Component
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

// VisitHistoryCard Component (modularized but currently not in use in main screen)
const VisitHistoryCard = ({patient}: {patient: Patient}) => {
  return (
    <Card style={styles.card}>
      <Card.Title
        title="Visit History"
        left={props => <Avatar.Icon {...props} icon="calendar-clock" />}
      />
      <Card.Content>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.visitsContainer}>
            {patient.visits.slice().map((visit, index) => (
              <Card key={index} style={styles.visitCard} mode="outlined">
                <Card.Content>
                  <Text variant="titleMedium">
                    {format(visit.createdAt, 'MMM d,yyyy')}
                  </Text>
                  <Text variant="bodySmall" style={styles.visitReason}>
                    {visit?.reason}
                  </Text>
                  <Divider style={styles.miniDivider} />
                  <Text variant="bodySmall" style={styles.visitStatus}>
                    Status: {visit.status}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const PatientDetailsScreen: FC<PatientDetailsProps> = ({patient, clinical}) => {
  console.log(clinical);

  return (
    <ScrollView style={styles.container}>
      <BasicInfoCard patient={patient} />
      <ClinicalInfoCard clinical={clinical[0]} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
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
    marginVertical: 8,
  },
  visitsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  visitCard: {
    width: 200,
    marginVertical: 4,
  },
  visitReason: {
    marginTop: 4,
    color: '#666',
  },
  visitStatus: {
    color: '#666',
  },
});

// Connect the component to WatermelonDB
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
  }),
)(PatientDetailsScreen);

export default EnhancePatientDetailsScreen;
