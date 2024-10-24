import React, {useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import {TextInput, Button, RadioButton} from 'react-native-paper';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DatePicker from 'react-native-date-picker'; // Import the date picker
import HeaderWithLogo from '../components/headerlogo';
import {database} from '../watermelodb/database';
import {Theme} from '../theme/theme';
import {useTheme} from 'react-native-paper';

import {useNavigation} from '@react-navigation/native';

// Enum for Gender selection
const Gender = {
  Male: 'Male',
  Female: 'Female',
  Other: 'Other',
};

// Form values interface
const initialFormValues = {
  Name: '',
  DateOfBirth: undefined,
  ContactInformation: '',
  Age: undefined,
  Gender: '',
  Height: undefined,
  Weight: undefined,
};

// Validation schema for Formik using Yup
const validationSchema = Yup.object().shape({
  Name: Yup.string().required('Name is required'),
  DateOfBirth: Yup.date().required('Date of Birth is required'),
  ContactInformation: Yup.string().required('Contact Information is required'),
  Age: Yup.number().required('Age is required').positive().integer(),
  Gender: Yup.string()
    .oneOf(Object.values(Gender))
    .required('Gender is required'),
  Height: Yup.number().required('Height is required').positive(),
  Weight: Yup.number().required('Weight is required').positive(),
});

const NewPatientScreen = () => {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleSubmit = async values => {
    await database.write(async () => {
      const patient = await database
        .get('patients')
        .create(patient => {
          patient.name = values.Name;
          patient.dateofBirth = values.DateOfBirth?.toString();
          patient.contactInformation = values.ContactInformation;
          patient.age = Number(values.Age);
          patient.gender = values.Gender;
          patient.height = Number(values.Height);
          patient.weight = Number(values.Weight);
        })
        .then(() => {
          navigation.navigate('home');
        });
    });
  };

  return (
    <View style={styles.container}>
      <HeaderWithLogo isShowInco={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Formik
            initialValues={initialFormValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  mode="outlined"
                  label="Name"
                  onChangeText={handleChange('Name')}
                  onBlur={handleBlur('Name')}
                  value={values.Name}
                  outlineColor={theme.colors.primary}
                />
                {touched.Name && errors.Name && (
                  <Text style={styles.errorText}>{errors.Name}</Text>
                )}

                <TextInput
                  style={styles.input}
                  mode="outlined"
                  label="Contact Information"
                  onChangeText={handleChange('ContactInformation')}
                  onBlur={handleBlur('ContactInformation')}
                  value={values.ContactInformation}
                  outlineColor={theme.colors.primary}
                />
                {touched.ContactInformation && errors.ContactInformation && (
                  <Text style={styles.errorText}>
                    {errors.ContactInformation}
                  </Text>
                )}

                <TextInput
                  style={styles.input}
                  mode="outlined"
                  label="Age"
                  keyboardType="numeric"
                  onChangeText={handleChange('Age')}
                  onBlur={handleBlur('Age')}
                  value={values.Age?.toString() ?? ''}
                  outlineColor={theme.colors.primary}
                />
                {touched.Age && errors.Age && (
                  <Text style={styles.errorText}>{errors.Age}</Text>
                )}

                <TextInput
                  style={styles.input}
                  mode="outlined"
                  label="Height (cm)"
                  keyboardType="numeric"
                  onChangeText={handleChange('Height')}
                  onBlur={handleBlur('Height')}
                  value={values.Height?.toString() ?? ''}
                  outlineColor={theme.colors.primary}
                />
                {touched.Height && errors.Height && (
                  <Text style={styles.errorText}>{errors.Height}</Text>
                )}

                <TextInput
                  style={styles.input}
                  mode="outlined"
                  label="Weight (kg)"
                  keyboardType="numeric"
                  onChangeText={handleChange('Weight')}
                  onBlur={handleBlur('Weight')}
                  value={values.Weight?.toString() ?? ''}
                  outlineColor={theme.colors.primary}
                />
                {touched.Weight && errors.Weight && (
                  <Text style={styles.errorText}>{errors.Weight}</Text>
                )}

                {/* Date of Birth Picker */}
                <Button
                  outlineColor={theme.colors.primary}
                  mode="outlined"
                  onPress={() => setOpen(true)}
                  style={styles.input}>
                  {values.DateOfBirth
                    ? values.DateOfBirth.toDateString()
                    : 'Select Date of Birth'}
                </Button>
                {touched.DateOfBirth && errors.DateOfBirth && (
                  <Text style={styles.errorText}>{errors.DateOfBirth}</Text>
                )}

                {/* Date picker modal */}
                <DatePicker
                  modal
                  open={open}
                  date={values.DateOfBirth || new Date()}
                  mode="date"
                  onConfirm={date => {
                    setOpen(false);
                    setFieldValue('DateOfBirth', date);
                  }}
                  onCancel={() => {
                    setOpen(false);
                  }}
                  outlineColor={theme.colors.primary}
                />

                <Text>Gender</Text>
                <RadioButton.Group
                  onValueChange={value => setFieldValue('Gender', value)}
                  value={values.Gender}>
                  <View style={styles.radioGroup}>
                    <RadioButton.Item label="Male" value={Gender.Male} />
                    <RadioButton.Item label="Female" value={Gender.Female} />
                    <RadioButton.Item label="Other" value={Gender.Other} />
                  </View>
                </RadioButton.Group>
                {touched.Gender && errors.Gender && (
                  <Text style={styles.errorText}>{errors.Gender}</Text>
                )}

                <Button mode="contained" onPress={() => handleSubmit()}>
                  Submit
                </Button>
              </View>
            )}
          </Formik>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  input: {
    marginBottom: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

export default NewPatientScreen;
