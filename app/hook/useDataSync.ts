import {useState, useCallback} from 'react';
import {synchronize, SyncDatabaseChangeSet} from '@nozbe/watermelondb/sync';
import {database} from '../watermelodb/database';
import {api} from '../api';
import {getLastPulledAt} from '@nozbe/watermelondb/sync/impl';
import {useStores} from '../models';
import {SyncStatus_Enum} from '../models/syncIndicator';

interface UseSyncReturn {
  isSyncing: boolean;
  syncData: () => Promise<void>;
}

const useSync = (): UseSyncReturn => {
  const {sync} = useStores();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  //   const { authToken } = useAuth()

  // Function to handle syncing
  const syncData = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    sync.setPdStatus(SyncStatus_Enum.Syncing);

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
        const response = await api.pull(lastPulledAt);

        if (response.kind !== 'ok') {
          sync.setPdStatus(SyncStatus_Enum.Error);
          return Promise.reject(response.kind);
        }

        const {changes, timestamp} = response.data;
        console.log('changes', changes);
        console.log('timestamp', timestamp);
        return {
          changes: changes as unknown as SyncDatabaseChangeSet,
          timestamp,
        };
      },
      pushChanges: async ({changes, lastPulledAt}): Promise<void> => {
        const response = await api.push(
          lastPulledAt,
          changes as SyncDatabaseChangeSet,
        );

        if (response.kind !== 'ok') {
          sync.setPdStatus(SyncStatus_Enum.Error);
          return Promise.reject(response.kind);
        }
      },
    })
      .then(async () => {
        syncSuccess = true;
        sync.setPdStatus(SyncStatus_Enum.Done);
        await getLastPulledAt(database).then(lastPulledAt => {
          if (lastPulledAt) {
            sync.setPdTimestamp(new Date(lastPulledAt * 1000));
          }
        });

        sync.setPdStatus(SyncStatus_Enum.Done);
      })
      .catch(error => {
        // Sync failed
        console.error('Sync error:', error);
        sync.setPdStatus(SyncStatus_Enum.Error);
      })
      .finally(() => {
        setIsSyncing(false);
      });

    if (!syncSuccess) {
      sync.setPdStatus(SyncStatus_Enum.Error);
    }
  }, []);

  return {
    isSyncing,
    syncData,
  };
};

export {useSync};
