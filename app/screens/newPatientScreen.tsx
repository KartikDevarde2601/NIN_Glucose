import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  RadioButton,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/appNavigation';
import {useForm, Controller} from 'react-hook-form';
import {DatePickerModal, registerTranslation} from 'react-native-paper-dates';

interface PatientFormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  contactInformation: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
}

// Register the English locale
registerTranslation('en', {
  save: 'Save',
  selectSingle: 'Select date',
  selectMultiple: 'Select dates',
  selectRange: 'Select period',
  notAccordingToDateFormat: inputFormat => `Date format must be ${inputFormat}`,
  mustBeHigherThan: date => `Must be later than ${date}`,
  mustBeLowerThan: date => `Must be earlier than ${date}`,
  mustBeBetween: (startDate, endDate) =>
    `Must be between ${startDate} - ${endDate}`,
  dateIsDisabled: 'Day is not allowed',
  previous: 'Previous',
  next: 'Next',
  typeInDate: 'Type in date',
  pickDateFromCalendar: 'Pick date from calendar',
  close: 'Close',
  hour: 'Hour',
  minute: 'Minute',
});

const NewPatientScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const theme = useTheme();
  const [date, setDate] = useState(null);
  const [visible, setVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      dateOfBirth: '',
      contactInformation: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
    },
  });

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({date}) => {
      setVisible(false);
      setDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setValue('dateOfBirth', formattedDate);
    },
    [setVisible, setValue],
  );

  const onSubmit = async (data: PatientFormData) => {
    // Navigate to clinical data form with the patient data
    navigation.navigate('addClinicalData', {
      patientForm: data,
    });
    reset();
    setDate(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Text style={styles.heading}>New Patient Registration</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Controller
          control={control}
          rules={{required: 'Full name is required'}}
          name="fullName"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Full Name"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.fullName}
              style={styles.input}
            />
          )}
        />
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName.message}</Text>
        )}

        <Controller
          control={control}
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          name="email"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Email"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.email}
              style={styles.input}
              keyboardType="email-address"
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        <Controller
          control={control}
          rules={{required: 'Date of birth is required'}}
          name="dateOfBirth"
          render={({field: {value}}) => (
            <>
              <TextInput
                label="Date of Birth"
                mode="outlined"
                value={value}
                onPressIn={() => setVisible(true)}
                style={styles.input}
                editable={false}
                right={
                  <TextInput.Icon
                    icon="calendar"
                    onPress={() => setVisible(true)}
                  />
                }
              />
            </>
          )}
        />

        <Controller
          control={control}
          rules={{required: 'Contact information is required'}}
          name="contactInformation"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Contact Information"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.contactInformation}
              style={styles.input}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          rules={{
            required: 'Age is required',
            pattern: {
              value: /^\d+$/,
              message: 'Please enter a valid age',
            },
          }}
          name="age"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Age"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.age}
              style={styles.input}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          rules={{required: 'Gender is required'}}
          name="gender"
          render={({field: {onChange, value}}) => (
            <View style={styles.radioGroup}>
              <Text>Gender:</Text>
              <RadioButton.Group onValueChange={onChange} value={value}>
                <View style={styles.radioButton}>
                  <RadioButton value="Male" />
                  <Text>Male</Text>
                </View>
                <View style={styles.radioButton}>
                  <RadioButton value="Female" />
                  <Text>Female</Text>
                </View>
              </RadioButton.Group>
            </View>
          )}
        />

        <Controller
          control={control}
          rules={{
            required: 'Height is required',
            pattern: {
              value: /^\d*\.?\d+$/,
              message: 'Please enter a valid height',
            },
          }}
          name="height"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Height (cm)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.height}
              style={styles.input}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          rules={{
            required: 'Weight is required',
            pattern: {
              value: /^\d*\.?\d+$/,
              message: 'Please enter a valid weight',
            },
          }}
          name="weight"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Weight (kg)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.weight}
              style={styles.input}
              keyboardType="numeric"
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}>
          Register Patient
        </Button>
      </ScrollView>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={visible}
        onDismiss={onDismiss}
        date={date || new Date()}
        onConfirm={onConfirm}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  radioGroup: {
    marginVertical: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});
export default NewPatientScreen;
