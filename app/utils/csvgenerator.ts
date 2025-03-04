import {jsonToCSV} from 'react-native-csv';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import {DatabaseService} from '../op-sqllite/databaseService';
import {Platform} from 'react-native';
import {OP_DB_TABLE} from '../op-sqllite/databaseService';

const showToastCSV = () => {
  Toast.show({
    type: 'info',
    text1: 'Generating CSV 🔄',
    text2: 'Wait for CSV generation 👋',
  });
};

const getQueryForConfig = (
  visitId: string,
  config: string,
  intervalTag: number,
): string => {
  return `
    SELECT * FROM ${OP_DB_TABLE.bioSensor}
    WHERE visit_id = '${visitId}' 
    AND config = '${config}'
    AND interval_tag = ${intervalTag}
  `;
};

const ensureDirectoryExists = async (path: string): Promise<void> => {
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path);
  }
};

const create_csv_andSave = async (
  configArray: string[],
  visitId: string,
  intervalTag: number,
  dbService: DatabaseService,
): Promise<void> => {
  showToastCSV();

  const baseDir =
    Platform.OS === 'android'
      ? RNFS.ExternalStorageDirectoryPath
      : RNFS.ExternalDirectoryPath;

  const ninDirPath = `${baseDir}/NIN`;
  const patientFolderPath = `${ninDirPath}/${visitId}`;

  try {
    await ensureDirectoryExists(ninDirPath);
    await ensureDirectoryExists(patientFolderPath);

    const results = await Promise.all(
      configArray.map(async config => {
        const query = getQueryForConfig(visitId, config, intervalTag);

        try {
          const results = await dbService.execute(query);
          const data = (results as any).rows;

          if (data.length > 0) {
            const csvContent = jsonToCSV(data);
            const filePath = `${patientFolderPath}/${config}_${intervalTag}.csv`;
            await RNFS.writeFile(filePath, csvContent, 'utf8');
            return true;
          }
          return false;
        } catch (err) {
          throw err;
        }
      }),
    );

    const successCount = results.filter(Boolean).length;

    Toast.show({
      type: 'success',
      text1: 'CSV Generation Complete ✅',
      text2: `${successCount} CSV files saved in ${patientFolderPath}`,
    });
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'CSV Generation Failed ❌',
      text2: `Error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });
  }
};

export {create_csv_andSave};
