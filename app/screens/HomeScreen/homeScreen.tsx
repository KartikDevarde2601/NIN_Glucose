import React, {useEffect, useState, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import PatientListScreen from './patientList';
import {Patient} from '../../watermelodb/models/patient';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/appNavigation';
import {Searchbar} from 'react-native-paper';
import {database} from '../../watermelodb/database';
import {DatabaseService, OP_DB_TABLE} from '../../op-sqllite/databaseService';

const HomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const dbService = useMemo(() => DatabaseService.getInstance(), []);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchData = async () => {
      const results = await dbService.execute(
        `SELECT * FROM ${OP_DB_TABLE.bioSensor}`,
      );
      console.log(results);
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search patients..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <PatientListScreen
        database={database}
        searchQuery={searchQuery}
        onPatientPress={(patient: Patient) => {
          navigation.navigate('patientDetail', {patientId: patient.id});
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
});
export default HomeScreen;
