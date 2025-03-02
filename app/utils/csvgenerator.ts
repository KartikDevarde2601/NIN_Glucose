import {jsonToCSV} from 'react-native-csv';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import {DatabaseService} from '../op-sqllite/databaseService';
import {PermissionsAndroid, Platform} from 'react-native';

// Function to request storage permission on Android
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // No permissions needed on iOS
};

const showToastCSV = () => {
  Toast.show({
    type: 'info',
    text1: 'Generating CSV 🔄',
    text2: 'Wait for CSV generation 👋',
  });
};

const getQuery = (sensorType: string, visitId: string): string => {
  return `
    SELECT * FROM sensor_data
    WHERE visit_id = '${visitId}' AND sensor_type = '${sensorType}'`;
};

const ensureDirectoryExists = async (path: string): Promise<void> => {
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path);
  }
};

const create_csv_andSave = async (
  sensorTypes: string[],
  visitId: string,
  patientName: string,
  dbService: DatabaseService,
): Promise<void> => {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    Toast.show({
      type: 'error',
      text1: 'Permission Denied ❌',
      text2: 'Storage permission is required to save CSV files.',
    });
    return;
  }

  showToastCSV();

  // Use external storage path for Android, fallback to app storage for iOS
  const rootPath =
    Platform.OS === 'android'
      ? '/storage/emulated/0/NIN' // External storage on Android
      : RNFS.ExternalDirectoryPath; // Fallback for iOS
  const patientFolderPath = `${rootPath}/${patientName}`;

  try {
    // Ensure folders exist
    await ensureDirectoryExists(rootPath);
    await ensureDirectoryExists(patientFolderPath);

    await Promise.all(
      sensorTypes.map(async sensorType => {
        const query = getQuery(sensorType, visitId);
        const results = await dbService.executeQuery(query);
        const data = (results as any).rows;

        if (data.length > 0) {
          const csvContent = jsonToCSV(data);
          const filePath = `${patientFolderPath}/${sensorType}.csv`;

          await RNFS.writeFile(filePath, csvContent, 'utf8');
        }
      }),
    );

    Toast.show({
      type: 'success',
      text1: 'CSV Generation Complete ✅',
      text2: `CSV files saved in ${patientFolderPath}`,
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    Toast.show({
      type: 'error',
      text1: 'CSV Generation Failed ❌',
      text2: 'An error occurred during CSV generation.',
    });
  }
};

export {create_csv_andSave};
