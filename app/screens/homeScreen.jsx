import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Theme} from '../theme/theme';
import PatientList from '../components/patinetList';
import HeaderWithLogo from '../components/headerlogo';
import withObservables from '@nozbe/with-observables';
import {withDatabase, compose} from '@nozbe/watermelondb/react';
import {Q} from '@nozbe/watermelondb';
import {DatabaseService} from '../op-sqllite/databaseService';
import {TABLE} from '../op-sqllite/db_table';
import SyncManager from '../sync/syncManeger';

const HomeScreen = ({patients}) => {
  const [search, setSearch] = useState('');

  const syncManager = new SyncManager('ws://10.2.137.217:8080', 10);

  useEffect(() => {
    const fetchData = async () => {
      // const db = DatabaseService.getInstance();
      // const result = await db.executeQuery(
      //   `SELECT * FROM ${TABLE.biosensor_data}`,
      // );

      // const data = result.rows[0].data;
      // console.log(data);

      syncManager.connectWebSocket();
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   const insertData = async () => {
  //     const Data = {
  //       visit_id: 'uebnd-dbdeb-fbfiwb',
  //       data: "{'temp': 36.5, 'pulse': 80, 'spo2': 98}",
  //     };
  //     const result = await sensorRepo.insertBioData(Data);
  //     console.log(result);
  //   };

  //   insertData();
  // }, []);

  return (
    <View style={styles.container}>
      <HeaderWithLogo isShowInco={true} />
      <PatientList patient={patients} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});

const enhance = compose(
  withDatabase,
  withObservables(['search'], ({database, search}) => ({
    patients: database.collections
      .get('patients')
      .query(
        search && search.length > 0
          ? Q.where('name', Q.like(`%${Q.sanitizeLikeString(search)}%`))
          : Q.where('name', Q.notLike('')),
      )
      .observe(),
  })),
);

export default enhance(HomeScreen);
