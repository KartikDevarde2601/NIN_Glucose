import {jsonToCSV} from 'react-native-csv';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import {DatabaseService} from '../op-sqllite/databaseService';
import {Platform} from 'react-native';
import {OP_DB_TABLE} from '../op-sqllite/databaseService';
import {database} from '../watermelodb/database';
import {Q} from '@nozbe/watermelondb';
import {formatDate} from './dateformater';

interface PatientInfo {
  age: number;
  alcoholConsumption: number;
  alcoholFreeDays: number;
  alcoholType: string;
  antigenStatus: string;
  bloodGroup: string;
  clinical_id: string;
  configuration: string; // JSON string, e.g., '{"configuration":["UPPERBODY","LEFTBODY","RIGHTBODY","LOWERBODY"]}'
  contactInformation: string;
  dailyConsumption: number;
  dataPoints: string;
  dateOfBirth: string;
  diastolic: number;
  email: string;
  frequencies: string; // JSON string, e.g., '{"frequencies":["1","5","50","200"]}'
  fullName: string;
  gender: string;
  height: number;
  hemoglobin: number;
  hereditaryHistory: string;
  intervalType: string;
  interval_id: string;
  interval_tag: number;
  overAllYearOfSmoking: number;
  patient_id: string;
  reacentHealthIssue: string;
  smokingIndex: number;
  smokingType: string;
  systolic: number;
  temperature: number;
  visitDate: string;
  visitNotes: string;
  visitType: string;
  visit_id: string;
  weight: number;
}

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

const getPatientInfo = async (interval_id: string): Promise<PatientInfo[]> => {
  const query = `
    SELECT 
      intervals.id AS interval_id,
      intervals.intervalType,
      intervals.interval_tag,
      intervals.configuration,
      intervals.frequencies,
      intervals.dataPoints,
      
      visits.id AS visit_id,
      visits.visitDate,
      visits.visitNotes,
      visits.visitType,
      
      patients.id AS patient_id,
      patients.fullName,
      patients.email,
      patients.dateOfBirth,
      patients.contactInformation,
      patients.age,
      patients.gender,
      patients.height,
      patients.weight,
      
      clinicals.id AS clinical_id,
      clinicals.bloodGroup,
      clinicals.antigenStatus,
      clinicals.systolic,
      clinicals.diastolic,
      clinicals.temperature,
      clinicals.smokingType,
      clinicals.overAllYearOfSmoking,
      clinicals.dailyConsumption,
      clinicals.smokingIndex,
      clinicals.alcoholFreeDays,
      clinicals.alcoholType,
      clinicals.alcoholConsumption,
      clinicals.hemoglobin,
      clinicals.reacentHealthIssue,
      clinicals.hereditaryHistory
    FROM intervals
    JOIN visits ON intervals.visit_id = visits.id
    JOIN patients ON visits.patient_id = patients.id
    LEFT JOIN clinicals ON patients.id = clinicals.patient_id
    WHERE intervals.id = ?
  `;

  const rawData: PatientInfo[] = await database
    .get('intervals')
    .query(Q.unsafeSqlQuery(query, [interval_id]))
    .unsafeFetchRaw();

  return rawData;
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
  interval_id: string,
  dbService: DatabaseService,
): Promise<void> => {
  showToastCSV();

  const date: Date = new Date();

  const dayName: string = date.toLocaleDateString('en-GB', {weekday: 'long'});
  const day: string = String(date.getDate()).padStart(2, '0');
  const month: string = String(date.getMonth() + 1).padStart(2, '0');
  const year: string = String(date.getFullYear());

  const formattedDate: string = `${dayName}_${day}-${month}-${year}`;

  const patientInfo = await getPatientInfo(interval_id);

  const baseDir =
    Platform.OS === 'android'
      ? RNFS.ExternalStorageDirectoryPath
      : RNFS.ExternalDirectoryPath;

  const ninDirPath = `${baseDir}/NIN`;
  const dateDirPath = `${ninDirPath}/${formattedDate
    .trim()
    .replace(/\s+/g, '_')}`;
  const formattedName = patientInfo[0].fullName.trim().replace(/\s+/g, '_');
  const patientFolderPath = `${dateDirPath}/${formattedName}`;
  const visitFolderPath = `${patientFolderPath}/${visitId}`;

  try {
    await ensureDirectoryExists(ninDirPath);
    await ensureDirectoryExists(dateDirPath);
    await ensureDirectoryExists(patientFolderPath);
    await ensureDirectoryExists(visitFolderPath);

    const patientcsvContent = jsonToCSV(
      patientInfo.map(({configuration, frequencies, ...rest}) => rest),
    );
    const patientInfoPath = `${visitFolderPath}/patientInfo.csv`;
    await RNFS.writeFile(patientInfoPath, patientcsvContent, 'utf8');

    const results = await Promise.all(
      configArray.map(async config => {
        const query = getQueryForConfig(visitId, config, intervalTag);

        try {
          const results = await dbService.execute(query);
          const data = (results as any).rows;

          if (data.length > 0) {
            const csvContent = jsonToCSV(data);
            const filePath = `${visitFolderPath}/${config}_${intervalTag}.csv`;
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
