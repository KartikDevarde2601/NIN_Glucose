import React, {useState} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {
  Avatar,
  Button,
  Text,
  Surface,
  ActivityIndicator,
  IconButton,
  Icon,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {format} from 'date-fns';
import {useSync} from '../hook/useSync';
import {useTheme} from 'react-native-paper';

const ProfileScreen = () => {
  const [syncType, setSyncType] = useState<'Patient' | 'Sensor' | null>(null);
  const {
    isSyncing,
    syncData,
    lastSyncTimestamp,
    syncStatus,
    setLastSyncTimestamp,
  } = useSync();
  const theme = useTheme();

  const handleLogout = () => {
    // Implement logout logic
  };

  const handlePatientDataSync = async () => {
    syncData();
  };

  const handleSensorDataSync = async () => {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.mainContainer}>
        <View style={styles.header}>
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => {}}
            style={styles.menuButton}
          />
          <Button
            mode="text"
            onPress={handleLogout}
            textColor="#FF5252"
            icon="logout">
            Logout
          </Button>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={require('../assets/images.png')}
              style={styles.avatar}
            />
            <View style={styles.onlineBadge} />
          </View>

          <Text variant="headlineSmall" style={styles.name}>
            Sarah Johnson
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            sarah.j@hospital.com
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statNumber}>
                127
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Patients
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statNumber}>
                45
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Active Cases
              </Text>
            </View>
          </View>
        </View>

        <Surface style={styles.syncSection}>
          <View style={styles.syncHeader}>
            <View style={{flexDirection: 'row', gap: 10}}>
              <Icon
                source="clock-time-eight"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={[
                  styles.lastSyncText,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                Last synced:{' '}
                {lastSyncTimestamp
                  ? format(new Date(lastSyncTimestamp), 'MMM dd, HH:mm')
                  : 'Never'}
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <Icon
                source="sync-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={[
                  styles.lastSyncText,
                  {color: theme.colors.onSurfaceVariant},
                ]}>
                {syncStatus}
              </Text>
            </View>

            {isSyncing && (
              <View style={styles.syncProgress}>
                <ActivityIndicator size={16} color="#6200ee" />
                <Text variant="bodySmall" style={styles.syncingText}>
                  {syncType === 'Patient'
                    ? 'Syncing patients...'
                    : 'Syncing sensors...'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handlePatientDataSync}
              style={[styles.syncButton, styles.patientButton]}
              icon="database-sync"
              disabled={isSyncing}
              contentStyle={styles.buttonContent}>
              Patient Data
            </Button>
            <Button
              mode="contained"
              onPress={handleSensorDataSync}
              style={[styles.syncButton, styles.sensorButton]}
              icon="sync"
              disabled={isSyncing}
              contentStyle={styles.buttonContent}>
              Sensor Data
            </Button>
          </View>
        </Surface>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  menuButton: {
    margin: 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    elevation: 4,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  email: {
    color: '#666666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 24,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    color: '#666666',
  },
  syncSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    elevation: 0,
  },
  syncHeader: {
    marginBottom: 24,
    gap: 10,
  },
  lastSyncText: {
    color: '#666666',
  },
  syncProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  syncingText: {
    marginLeft: 8,
    color: '#6200ee',
  },
  buttonContainer: {
    gap: 16,
  },
  syncButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 40,
  },
  patientButton: {
    backgroundColor: '#6200ee',
  },
  sensorButton: {
    backgroundColor: '#3700b3',
  },
});

export default ProfileScreen;
