import React from 'react';
import {Card, Text, Chip, Divider, IconButton} from 'react-native-paper';
import {View, StyleSheet, Alert} from 'react-native';
import {Patient} from '../../watermelodb/models/patient';
import {withObservables} from '@nozbe/watermelondb/react';
import {database} from '../../watermelodb/database';
interface Props {
  patient: Patient;
  onPatientPress?: (patient: Patient) => void;
}

export const renderPatientCard = ({patient, onPatientPress}: Props) => {
  const age = patient.age;
  const bmi = (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1);

  const onDeletePress = (patient: Patient) => {
    database.write(async () => {
      await patient.markAsDeleted();
    });
  };

  const handleDelete = (patient: Patient) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.fullName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => onDeletePress?.(patient),
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <Card style={styles.card} onPress={() => onPatientPress?.(patient)}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text variant="titleLarge" style={styles.name}>
              {patient.fullName}
            </Text>
            <Text variant="titleSmall" style={styles.email}>
              {patient.email}
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={24}
            iconColor="grey"
            onPress={() => handleDelete(patient)}
          />
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => onPatientPress?.(patient)}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.chipContainer}>
          <Chip icon="calendar" style={styles.chip}>
            {age} years
          </Chip>
          <Chip icon="human" style={styles.chip}>
            {patient.gender}
          </Chip>
          <Chip icon="scale" style={styles.chip}>
            BMI: {bmi}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
};

export const EnhacedRenderPatientCard = withObservables(
  ['patient'],
  ({patient}: {patient: Patient}) => ({
    patient: patient.observe(),
  }),
)(renderPatientCard);

const styles = StyleSheet.create({
  card: {
    margin: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  email: {
    color: 'gray',
  },
  divider: {
    marginVertical: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    gap: 16,
  },
  chip: {
    marginHorizontal: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timestamp: {
    color: 'gray',
  },
  visitCount: {
    color: 'gray',
  },
});
