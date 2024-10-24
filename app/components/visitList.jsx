import react from 'react';
import {useState, useMemo, useRef} from 'react';
import VisitCard from './visitCard';
import VisitBottomSheet from './visitBottomSheet';
import {View, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {Headline} from 'react-native-paper';
import {useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {database} from '../watermelodb/database';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';

const VisitList = ({visits, patient}) => {
  const theme = useTheme();

  // Bottom sheet setup
  const sheetRef = useRef(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [sheetType, setSheetType] = useState('');

  const snapPoints = useMemo(() => ['80%', '50%'], []);

  // Function to open the bottom sheet
  const openBottomSheet = (visit, type) => {
    setSelectedVisit(visit);
    setSheetType(type); // Set the sheetType correctly
    sheetRef.current.snapToIndex(1); // open to 80%
  };

  // Function to handle the form submission
  const handleSubmit = () => {
    sheetRef.current.close();
    setClinicalInfo('');
    setDataCollectionInfo('');
  };

  const handlePressAddVisit = async () => {
    try {
      const visit = await patient.addvisit();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <View style={styles.container}>
        <View style={styles.visitsHeader}>
          <View style={styles.headerLeft}>
            <Icon name="calendar" size={28} color={theme.colors.primary} />
            <Headline style={styles.sectionTitle}>Visits</Headline>
          </View>
          <TouchableOpacity
            onPress={handlePressAddVisit}
            style={styles.addButton}>
            <Icon name="plus-circle" size={36} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={visits}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <VisitCard item={item} openBottomSheet={openBottomSheet} />
          )}
        />
        <VisitBottomSheet
          sheetRef={sheetRef}
          snapPoints={snapPoints}
          sheetType={sheetType}
          selectedVisit={selectedVisit}
          handleSubmit={handleSubmit}
        />
      </View>
    </>
  );
};

const enhance = withObservables(['patientID'], ({patientID}) => ({
  patient: database.collections.get('patients').findAndObserve(patientID),
  visits: database.collections
    .get('visits')
    .query(Q.where('patient_id', patientID)),
}));

export default enhance(VisitList);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  visitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
