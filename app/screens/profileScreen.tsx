import React from 'react';
import {SafeAreaView, StyleSheet, View, Alert, Text} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import {useState} from 'react';
import {saveString, loadString} from '../utils/storage';
import SyncManager from '../sync/syncManeger';

interface ProfileScreenProps {}

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const [IP, setIP] = useState<string>(loadString('IP') || '');
  const [loading, setLoading] = useState<boolean>(false);

  // Example initialization
  const syncManager = new SyncManager('ws://10.2.138.162:8081/ws', 5, {
    debugMode: true,
    reconnectAttempts: 3,
    syncTimeout: 20000,
  });

  // Dummy data for nurse profile
  const nurseData = {
    name: 'Nurse Jane Doe',
    hospital: 'General Hospital',
    imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg', // Replace with a valid image URL
  };

  const handleSetIP = () => {
    saveString('IP', IP || '');
    Alert.alert('IP Address Set', 'IP Address has been set successfully');
    setIP('');
  };

  const handleSyncData = async () => {
    try {
      setLoading(true);

      // Ensure only one sync process is initiated
      if (!syncManager.syncInProgress) {
        const websocket = syncManager.connectWebSocket();

        if (websocket) {
          await syncManager.deleteIsSyncedData();
          const response = await syncManager.startSync();

          if (response) {
            setLoading(false);
            console.log('Sync successful');
          } else {
            // Handle sync failure
            setLoading(false);
            console.warn('Sync failed');
          }
        } else {
          // Handle WebSocket connection failure
          setLoading(false);
          console.warn('WebSocket connection failed');
        }
      }
    } catch (error) {
      setLoading(false);
      console.warn('Sync process error:', error);
    }
  };

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

export default ProfileScreen;
