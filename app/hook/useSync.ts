import {useState, useCallback} from 'react';
import {synchronize, SyncDatabaseChangeSet} from '@nozbe/watermelondb/sync';
import {database} from '../watermelodb/database';
import {api} from '../api';
import {getLastPulledAt} from '@nozbe/watermelondb/sync/impl';

interface UseSyncReturn {
  isSyncing: boolean;
  syncStatus: string | null;
  lastSyncTimestamp: string | null;
  setLastSyncTimestamp: (timestamp: string) => void;
  syncData: () => Promise<void>;
}

const useSync = (): UseSyncReturn => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>('No Sync Status');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(
    null,
  );
  //   const { authToken } = useAuth()

  // Function to handle syncing
  const syncData = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    setSyncStatus('Data is Syncing 🔄');

    let syncSuccess = false;

    // if (!authToken) {
    //   setSyncStatus("Auth token is not found")
    //   setIsSyncing(false)
    //   return Promise.resolve()
    // }

    await synchronize({
      sendCreatedAsUpdated: true,
      database,
      pullChanges: async ({lastPulledAt}) => {
        const response = await api.pull(lastPulledAt, false);

        if (response.kind !== 'ok') {
          setSyncStatus('Error in pulling data');
          return Promise.reject(response.kind);
        }

        const {changes, timestamp} = response.data;
        return {
          changes: changes as unknown as SyncDatabaseChangeSet,
          timestamp,
        };
      },
      pushChanges: async ({changes, lastPulledAt}): Promise<void> => {
        console.log('local changes', changes.sensorvalues.created[0]);
        const response = await api.push(
          lastPulledAt,
          changes as SyncDatabaseChangeSet,
        );

        if (response.kind !== 'ok') {
          setSyncStatus('Error in pushing data');
          return Promise.reject(response.kind);
        }
      },
    })
      .then(async () => {
        syncSuccess = true;

        setLastSyncTimestamp(new Date().toISOString());
        await getLastPulledAt(database).then(lastPulledAt => {
          if (lastPulledAt) {
            setLastSyncTimestamp(new Date(lastPulledAt * 1000).toISOString());
          }
        });

        setSyncStatus('Data is Synced ✅');
      })
      .catch(error => {
        // Sync failed
        console.error('Sync error:', error);
        setSyncStatus('Sync Failed ❌');
      })
      .finally(() => {
        setIsSyncing(false);
      });

    if (!syncSuccess) {
      setSyncStatus('Sync Failed ❌');
    }
  }, []);

  return {
    isSyncing,
    syncStatus,
    lastSyncTimestamp,
    syncData,
    setLastSyncTimestamp,
  };
};

export {useSync};
