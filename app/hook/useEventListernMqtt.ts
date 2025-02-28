import * as React from 'react';
import {MqttClient} from '@kartik2601/rn-mqtt-android/dist/Mqtt/MqttClient';
import {useStores} from '../models';
import {ConnectionStatus} from '../models/mqtt';

export const useEventListeners = (mqttClient: MqttClient | undefined) => {
  const {mqtt} = useStores();
  React.useEffect(() => {
    const connectionListener = mqttClient?.setOnConnectCallback(ack => {
      console.log('Client Connection Success Listner', ack);
      mqtt.updateIsConnected(true);
      mqtt.updateStatus(ConnectionStatus.CONNECTED);
    });

    const onConnectFailureListener = mqttClient?.setOnConnectFailureCallback(
      reasonCode => {
        console.log('Client Connection Failure Listner', reasonCode);
        mqtt.updateIsConnected(false);
        mqtt.updateStatus(ConnectionStatus.ERROR);
      },
    );

    const onErrorFailureListener = mqttClient?.setOnErrorCallback(ack => {
      console.log('Client Connection Failure Listner', ack);
      mqtt.updateIsConnected(false);
      mqtt.updateStatus(ConnectionStatus.ERROR);
    });

    const onDisconnectFailureListener = mqttClient?.setOnDisconnectCallback(
      ack => {
        console.log('Client Connection Failure Listner', ack);
        mqtt.updateIsConnected(false);
        mqtt.updateStatus(ConnectionStatus.DISCONNECTED);
      },
    );

    return () => {
      connectionListener?.remove();
      onConnectFailureListener?.remove();
      onErrorFailureListener?.remove();
      onDisconnectFailureListener?.remove();
    };
  }, [mqttClient]);
};
