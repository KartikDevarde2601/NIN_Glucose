import React, {useState, useRef, useMemo} from 'react';
import {View, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {Headline, Divider, Provider as PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import {database} from '../watermelodb/database';
import VisitCard from '../components/visitCard';
import VisitBottomSheet from '../components/visitBottomSheet';
import PatientDetailsCard from '../components/patientDetailsCard';
import {Theme} from '../theme/theme'; // Import your custom theme

// Merged PatientDetailsScreen with VisitList
const PatientDetailsScreen = ({patient, visits}) => {
  const theme = useTheme();

  // Bottom sheet setup
  const sheetRef = useRef(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [sheetType, setSheetType] = useState('');

  const snapPoints = useMemo(() => ['80%', '50%'], []);

  // Function to open the bottom sheet
  const openBottomSheet = (visit, type) => {
    setSelectedVisit(visit);
    setSheetType(type);
    sheetRef.current.snapToIndex(1); // open to 80%
  };

  // Function to handle the form submission
  const handleSubmit = () => {
    sheetRef.current.close();
  };

  const handlePressAddVisit = async () => {
    try {
      const visit = await patient.addvisit(); // Assuming `addvisit` is defined in the patient model
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PaperProvider theme={Theme}>
      <View style={styles.container}>
        {/* Patient Details */}
        <PatientDetailsCard patient={patient._raw} />
        <Divider style={styles.divider} bold={true} />

        {/* Visit List */}
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

        {/* Bottom Sheet for visit details */}
        <VisitBottomSheet
          sheetRef={sheetRef}
          snapPoints={snapPoints}
          sheetType={sheetType}
          selectedVisit={selectedVisit}
          handleSubmit={handleSubmit}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F5F5F5',
  },
  divider: {
    marginVertical: 8,
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

const enhance = withObservables(['route'], ({route}) => ({
  patient: database.collections
    .get('patients')
    .findAndObserve(route.params.patientID),
  visits: database.collections
    .get('visits')
    .query(Q.where('patient_id', route.params.patientID)),
}));

export default enhance(PatientDetailsScreen);
