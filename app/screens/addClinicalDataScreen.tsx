import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TextInput, Button, Text, SegmentedButtons} from 'react-native-paper';
import {useForm, Controller} from 'react-hook-form';

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const smokingTypes = ['Never', 'Former', 'Current', 'Passive'];
const alcoholTypes = ['Never', 'Occasional', 'Regular', 'Former'];

const AddClinicalDataScreen = () => {
  const bloodGroupRow1 = bloodGroupOptions.slice(0, 4); // A+, A-, B+, B-
  const bloodGroupRow2 = bloodGroupOptions.slice(4); // AB+, AB-, O+, O-

  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm({
    defaultValues: {
      bloodGroup: '',
      antigenStatus: '',
      systolic: '',
      diastolic: '',
      temperature: '',
      smokingType: '',
      overAllYearOfSmoking: '',
      dailyConsumption: '',
      smokingIndex: '',
      alcoholFreeDays: '',
      alcoholType: '',
      alcoholConsumption: '',
      hemoglobin: '',
      reacentHealthIssue: '',
      hereditaryHistory: '',
    },
  });

  const onSubmit = data => {
    console.log(data);
    // Handle form submission
  };

  const smokingType = watch('smokingType');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Medical Information</Text>

        <Text style={styles.label}>Blood Group</Text>
        <Controller
          control={control}
          rules={{required: 'Blood group is required'}}
          name="bloodGroup"
          render={({field: {onChange, value}}) => (
            <View style={styles.bloodGroupContainer}>
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={bloodGroupRow1.map(group => ({
                  value: group,
                  label: group,
                }))}
                style={styles.segmentedButton}
              />
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={bloodGroupRow2.map(group => ({
                  value: group,
                  label: group,
                }))}
                style={styles.segmentedButton}
              />
            </View>
          )}
        />
        {errors.bloodGroup && (
          <Text style={styles.errorText}>{errors.bloodGroup.message}</Text>
        )}

        {/* Antigen Status */}
        <Controller
          control={control}
          name="antigenStatus"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Antigen Status"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />

        {/* Blood Pressure */}
        <View style={styles.row}>
          <Controller
            control={control}
            rules={{
              required: 'Required',
              pattern: {
                value: /^\d+$/,
                message: 'Must be a number',
              },
            }}
            name="systolic"
            render={({field: {onChange, value}}) => (
              <TextInput
                label="Systolic"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                style={[styles.input, styles.halfWidth]}
                error={!!errors.systolic}
              />
            )}
          />
          <Controller
            control={control}
            rules={{
              required: 'Required',
              pattern: {
                value: /^\d+$/,
                message: 'Must be a number',
              },
            }}
            name="diastolic"
            render={({field: {onChange, value}}) => (
              <TextInput
                label="Diastolic"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                style={[styles.input, styles.halfWidth]}
                error={!!errors.diastolic}
              />
            )}
          />
        </View>

        {/* Temperature */}
        <Controller
          control={control}
          rules={{
            required: 'Temperature is required',
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Must be a valid temperature',
            },
          }}
          name="temperature"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Temperature (°C)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.temperature}
            />
          )}
        />

        {/* Smoking Information */}
        <Text style={styles.sectionTitle}>Smoking Information</Text>
        <Controller
          control={control}
          name="smokingType"
          render={({field: {onChange, value}}) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={smokingTypes.map(type => ({
                value: type,
                label: type,
              }))}
              style={styles.segmentedButton}
            />
          )}
        />

        {(smokingType === 'Former' || smokingType === 'Current') && (
          <>
            <Controller
              control={control}
              name="overAllYearOfSmoking"
              render={({field: {onChange, value}}) => (
                <TextInput
                  label="Years of Smoking"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="dailyConsumption"
              render={({field: {onChange, value}}) => (
                <TextInput
                  label="Daily Consumption"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}
            />
          </>
        )}

        {/* Alcohol Information */}
        <Text style={styles.sectionTitle}>Alcohol Information</Text>
        <Controller
          control={control}
          name="alcoholType"
          render={({field: {onChange, value}}) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={alcoholTypes.map(type => ({
                value: type,
                label: type,
              }))}
              style={styles.segmentedButton}
            />
          )}
        />

        <Controller
          control={control}
          name="alcoholFreeDays"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Alcohol Free Days"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              style={styles.input}
            />
          )}
        />

        <Controller
          control={control}
          name="alcoholConsumption"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Alcohol Consumption (units/week)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              style={styles.input}
            />
          )}
        />

        {/* Medical Readings */}
        <Text style={styles.sectionTitle}>Medical Readings</Text>
        <Controller
          control={control}
          rules={{
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Must be a valid number',
            },
          }}
          name="hemoglobin"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Hemoglobin"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.hemoglobin}
            />
          )}
        />

        {/* Health History */}
        <Controller
          control={control}
          name="reacentHealthIssue"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Recent Health Issues"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}
        />

        <Controller
          control={control}
          name="hereditaryHistory"
          render={({field: {onChange, value}}) => (
            <TextInput
              label="Hereditary History"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}>
          Save Medical Information
        </Button>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  segmentedButton: {
    marginBottom: 12,
  },
  bloodGroupContainer: {
    gap: 8, // Space between the two rows
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default AddClinicalDataScreen;
