import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {Button, TextInput, Switch, Text, Surface} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useStores} from '../models';
import {MqttConfig} from '@kartik2601/rn-mqtt-android';
import Toast from 'react-native-toast-message';

export const SettingScreen = () => {
  const {mqtt} = useStores();
  const [enableAdvancedConfig, setEnableAdvancedConfig] = useState(false);

  const {control, handleSubmit} = useForm({
    defaultValues: {
      clientId: mqtt.clientId,
      host: mqtt.host,
      port: mqtt.port.toString(),
      option: mqtt.options,
    },
  });

  const onSubmit = (data: {
    clientId: string;
    host: string;
    port: string;
    option: any;
  }) => {
    mqtt.editConfig({...data, port: Number(data.port)});
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Mqtt configure successfully',
      position: 'top',
      visibilityTime: 2000,
      autoHide: true,
      topOffset: 30,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.surface}>
        <Text variant="headlineMedium">MQTT Config</Text>
        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="clientId"
            render={({field: {onChange, value}}) => (
              <TextInput
                label="Client ID"
                value={value}
                onChangeText={onChange}
                mode="outlined"
              />
            )}
          />
          <Controller
            control={control}
            name="host"
            render={({field: {onChange, value}}) => (
              <TextInput
                label="Host/IP"
                value={value}
                onChangeText={onChange}
                mode="outlined"
              />
            )}
          />
          <Controller
            control={control}
            name="port"
            render={({field: {onChange, value}}) => (
              <TextInput
                label="Port"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="numeric"
              />
            )}
          />
        </View>
        <View style={styles.toggleContainer}>
          <Text>Advanced Config</Text>
          <Switch
            value={enableAdvancedConfig}
            onValueChange={setEnableAdvancedConfig}
          />
        </View>
        {enableAdvancedConfig && (
          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="option.username"
              render={({field: {onChange, value}}) => (
                <TextInput
                  label="Username"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                />
              )}
            />
            <Controller
              control={control}
              name="option.password"
              render={({field: {onChange, value}}) => (
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  secureTextEntry
                />
              )}
            />
            <Controller
              control={control}
              name="option.enableSslConfig"
              render={({field: {onChange, value}}) => (
                <View style={styles.switchRow}>
                  <Text>Enable SSL Config</Text>
                  <Switch value={value} onValueChange={onChange} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="option.autoReconnect"
              render={({field: {onChange, value}}) => (
                <View style={styles.switchRow}>
                  <Text>Auto Reconnect</Text>
                  <Switch value={value} onValueChange={onChange} />
                </View>
              )}
            />
          </View>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}>
          Save Settings
        </Button>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  formContainer: {
    marginVertical: 12,
    gap: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  button: {
    marginTop: 16,
  },
});
