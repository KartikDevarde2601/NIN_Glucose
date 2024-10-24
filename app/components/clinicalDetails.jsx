import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Headline, Text, useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {database} from '../watermelodb/database';
import withObservables from '@nozbe/with-observables';
import {ScrollView} from 'react-native-gesture-handler';
import {Q} from '@nozbe/watermelondb';

const ClinicalDetails = ({clinical}) => {
  const theme = useTheme();

  const data = {
    visit_id: 'V123456',
    bloodGroup: 'O+',
    antigenStatus: 'Negative',
    systolic: 120,
    diastolic: 80,
    temperature: 36.5,
    smokingType: 'Cigarettes',
    overAllYearOfSmoking: 10,
    dailyConsumption: 5,
    smokingIndex: 50,
    alcoholFreeDays: 20,
    alcoholType: 'Beer',
    alcoholConsumption: 3,
    homoglobin: 13.5,
    reacentHealthIssue: 'None',
    hereditaryHistory: 'Hypertension',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <Icon name="badge" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Visit ID: {data.visit_id}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="bloodtype" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Blood Group: {data.bloodGroup}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="security" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Antigen Status: {data.antigenStatus}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="favorite" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Systolic: {data.systolic}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="favorite-border" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Diastolic: {data.diastolic}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="thermostat" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Temperature: {data.temperature}°C</Text>
      </View>
      <View style={styles.row}>
        <Icon name="smoking-rooms" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Smoking Type: {data.smokingType}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="schedule" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Overall Years of Smoking: {data.overAllYearOfSmoking}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="history" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Daily Consumption: {data.dailyConsumption}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="assessment" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Smoking Index: {data.smokingIndex}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="local-bar" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Alcohol-Free Days: {data.alcoholFreeDays}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="wine-bar" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Alcohol Type: {data.alcoholType}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="liquor" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Alcohol Consumption: {data.alcoholConsumption}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="healing" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>Hemoglobin: {data.homoglobin}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="medical-services" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Recent Health Issue: {data.reacentHealthIssue}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="family-restroom" size={24} color={theme.colors.primary} />
        <Text style={styles.text}>
          Hereditary History: {data.hereditaryHistory}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    marginLeft: 10,
    fontSize: 16,
  },
});

const enhance = withObservables(['visitID'], ({visitID}) => ({
  clinics: database.collections
    .get('clinics')
    .query(Q.where('visit_id', visitID)),
}));

export default enhance(ClinicalDetails);
