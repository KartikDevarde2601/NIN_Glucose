import React, {useState, useRef, useMemo} from 'react';
import {View, FlatList, TouchableOpacity, StyleSheet, Text} from 'react-native';
import {Headline, Divider, Provider as PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import withObservables from '@nozbe/with-observables';
import {Q} from '@nozbe/watermelondb';
import {database} from '../watermelodb/database';
import {Theme} from '../theme/theme'; // Import your custom theme

// Merged PatientDetailsScreen with VisitList
const PatientDetailsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PatientDetailsScreen;
