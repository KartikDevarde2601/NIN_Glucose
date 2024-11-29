import React from 'react';
import {SafeAreaView, StyleSheet, View, Alert, Text} from 'react-native';
import NurseProfile from '../components/nurseProfile'; // Import NurseProfile component
import HeaderWithLogo from '../components/headerlogo'; // Import HeaderWithLogo component
import {TextInput, Button} from 'react-native-paper';
import {useState} from 'react';
import {saveString, loadString} from '../utils/storage';
import SyncManager from '../sync/syncManeger';

interface ProfileScreenProps {}

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const [IP, setIP] = useState<string>(loadString('IP') || '');
  const [loading, setLoading] = useState<boolean>(false);

  const syncManager = new SyncManager('ws://10.2.137.217:8080', 10);

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
    setLoading(true);
    const websocket = await syncManager.connectWebSocket();
    if (websocket !== null) {
      await syncManager.deleteIsSyncedData();
      const response = await syncManager.startSync();
      console.log('response', response);
      if (response) {
        setLoading(!response);
      }
    }
  };

  return (
    <SafeAreaView>
      <HeaderWithLogo isShowInco={false} />
      <NurseProfile
        name={nurseData.name}
        hospital={nurseData.hospital}
        imageUrl={nurseData.imageUrl}
      />
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          label="IP Address"
          value={IP}
          onChangeText={text => setIP(text)}
          style={styles.textInput}
        />
        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={handleSetIP} style={styles.button}>
            set broker ip
          </Button>
          <Button
            mode="outlined"
            onPress={handleSyncData}
            style={styles.button}
            loading={loading}
            disabled={loading}>
            sync data
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  textInput: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    margin: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
