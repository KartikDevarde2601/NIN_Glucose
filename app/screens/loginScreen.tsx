import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {Button, TextInput, useTheme} from 'react-native-paper';

const LoginScreen: React.FC = () => {
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

export default LoginScreen;
