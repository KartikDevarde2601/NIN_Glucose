import React from 'react';
import {View, StyleSheet} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {EnhacedRenderPatientCard} from './patientCard';
import {withObservables} from '@nozbe/watermelondb/react';
import {Q} from '@nozbe/watermelondb';
import {Patient} from '../../watermelodb/models/patient';
import {Text} from 'react-native-paper';
import {TableName} from '../../watermelodb/schema';

type PatientListScreenProps = {
  searchQuery: string;
  patients: Patient[];
  onPatientPress?: (patient: Patient) => void;
  database: any;
};

const PatientListScreen = ({
  patients,
  onPatientPress,
}: PatientListScreenProps) => {
  return (
    <View style={styles.container}>
      <FlashList
        data={patients}
        renderItem={({item}) => (
          <EnhacedRenderPatientCard
            patient={item}
            onPatientPress={onPatientPress}
          />
        )}
        estimatedItemSize={200}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No patients found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
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
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    color: '#666',
  },
  visitCount: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

// Connect the component to WatermelonDB
const enhanced = withObservables(
  ['searchQuery', 'database'],
  ({searchQuery, database}) => {
    const patientsCollection = database.collections.get(TableName.PATIENTS);
    return {
      patients: patientsCollection
        .query(
          ...(searchQuery
            ? [
                Q.where(
                  'fullName',
                  Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`),
                ),
              ]
            : []),
        )
        .observe(),
    };
  },
);

export default enhanced(PatientListScreen);
