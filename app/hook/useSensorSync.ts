import {useState, useEffect, useCallback, useRef} from 'react';
import {DatabaseService} from '../op-sqllite/databaseService';
import {OP_DB_TABLE} from '../op-sqllite/databaseService';
import {useStores} from '../models';
import {SyncStatus_Enum} from '../models/syncIndicator';

// Interface for server response structure
interface ServerResponse {
  success: boolean;
  error?: string;
  table: string;
  ids: number[];
}

// Configuration options for synchronization
interface SyncOptions {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  syncTimeout?: number;
  debugMode?: boolean;
}

interface ProgressEntry {
  offset: number;
  complete: boolean;
  retries: number;
  lastError: Date | null;
  ids: number[];
}

interface SyncProgress {
  [key: string]: ProgressEntry;
}

// Valid tables for synchronization
const VALID_TABLES = new Set([OP_DB_TABLE.bioSensor]);

// Custom hook implementation
const useDataSync = (
  serverUrl: string,
  branchSize: number,
  options: SyncOptions = {},
) => {
  // State management
  const {sync} = useStores();
  const [isSyncingSensor, setIsSyncingSensor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProgressEntry = (): ProgressEntry => {
    return {
      offset: 0,
      complete: false,
      retries: 0,
      lastError: null,
      ids: [],
    };
  };

  const initializationSyncProgress = (): SyncProgress => {
    return {
      [OP_DB_TABLE.bioSensor]: createProgressEntry(),
    };
  };

  // Refs for mutable values that persist between renders
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const processedRecordsRef = useRef(0);
  const syncProgressRef = useRef<SyncProgress>(initializationSyncProgress());

  // Configuration with defaults
  const config = {
    reconnectAttempts: options.reconnectAttempts ?? 5,
    reconnectDelay: options.reconnectDelay ?? 5000,
    syncTimeout: options.syncTimeout ?? 30000,
    debugMode: options.debugMode ?? true,
  };

  // Database service instance
  const db = DatabaseService.getInstance();

  // Debug logging helper
  const log = useCallback(
    (message: string, level: 'log' | 'warn' | 'error' = 'log') => {
      if (config.debugMode) {
        const timestamp = new Date().toISOString();
        console[level](`[useDataSync ${timestamp}] ${message}`);
      }
    },
    [config.debugMode],
  );

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Close WebSocket connection
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      // Clear any pending reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        log('WebSocket already connected');
        return resolve();
      }

      log(`Connecting to WebSocket at ${serverUrl}`);
      wsRef.current = new WebSocket(serverUrl);

      // Connection opened
      wsRef.current.onopen = () => {
        log('WebSocket connection established');
        reconnectCountRef.current = 0;
        resolve();
      };

      // Message received handler
      wsRef.current.onmessage = async event => {
        try {
          const response: ServerResponse = JSON.parse(event.data);
          if (response.success && response.table && response.ids) {
            const progress = syncProgressRef.current[response.table];
            progress.ids = [...progress.ids, ...response.ids];
            processedRecordsRef.current += response.ids.length;
          }
        } catch (parseError) {
          log(`Error parsing server response: ${parseError}`, 'error');
          setError('Invalid server response format');
        }
      };

      // Connection closed handler
      wsRef.current.onclose = event => {
        log(`WebSocket closed: ${event.reason}`, 'warn');
        if (isSyncingSensor) {
          handleConnectionLoss();
        }
      };

      // Error handler
      wsRef.current.onerror = (event: Event) => {
        const errorEvent = event as ErrorEvent;
        log(`WebSocket error: ${errorEvent.message}`, 'error');
        reject(errorEvent.message);
      };
    });
  }, [serverUrl, isSyncingSensor, log]);

  // Mark records as synced in local database
  const markRecordsAsSynced = useCallback(
    async (process: ProgressEntry, tableName: string) => {
      if (process.ids.length === 0) return;

      try {
        const placeholders = process.ids.map(() => '?').join(',');
        const query = `
          UPDATE ${tableName}
          SET is_synced = 1
          WHERE id IN (${placeholders})
        `;

        const result = await db.transactional(query, process.ids);
        log(`Marked ${process.ids.length} records as synced in ${tableName}`);
      } catch (dbError) {
        log(`Failed to mark records as synced: ${dbError}`, 'error');
        setError('Database update failed');
      }
    },
    [db, log],
  );

  // Handle connection loss and schedule reconnect
  const handleConnectionLoss = useCallback(() => {
    if (reconnectCountRef.current >= config.reconnectAttempts) {
      log('Maximum reconnect attempts reached', 'error');
      setError('Connection lost - unable to reconnect');
      setIsSyncingSensor(false);
      return;
    }

    const delay =
      config.reconnectDelay * Math.pow(2, reconnectCountRef.current);
    reconnectCountRef.current++;

    log(
      `Attempting reconnect in ${delay}ms (attempt ${reconnectCountRef.current})`,
    );

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await connectWebSocket();
        log('Reconnect successful, resuming sync');
      } catch (reconnectError) {
        log(`Reconnect failed: ${reconnectError}`, 'error');
        handleConnectionLoss();
      }
    }, delay);
  }, [config.reconnectAttempts, config.reconnectDelay, connectWebSocket, log]);

  // Fetch batch of unsynced records
  const fetchBatch = useCallback(
    async (tableName: string, progress: ProgressEntry) => {
      try {
        const query = `
          SELECT * FROM ${tableName}
          WHERE is_synced = 0
          ORDER BY id
          LIMIT ? OFFSET ?
        `;

        const result = await db.execute(query, [branchSize, progress.offset]);
        return {
          data: result.rows,
        };
      } catch (queryError) {
        log(`Failed to fetch batch: ${queryError}`, 'error');
        setError('Database query failed');
        return {data: []};
      }
    },
    [branchSize, db, log],
  );

  // Send data through WebSocket
  const sendData = useCallback(
    async (tableName: string, progress: ProgressEntry, data: any[]) => {
      return new Promise<void>((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return reject('WebSocket not connected');
        }

        const message = {
          type: 'sync_data',
          table: tableName,
          data: data,
          timestamp: Date.now(),
        };

        wsRef.current.send(JSON.stringify(message));
        progress.offset += branchSize;
        progress.retries = 0;
        process;
        log(`Sent ${data.length} records from ${tableName}`);
        resolve();
      });
    },
    [log],
  );

  // Main sync function
  const startSync = useCallback(async () => {
    if (isSyncingSensor) {
      log('Sync already in progress', 'warn');
      return;
    }

    try {
      sync.setSdStatus(SyncStatus_Enum.Syncing);
      setIsSyncingSensor(true);
      setError(null);
      processedRecordsRef.current = 0;

      // Connect to WebSocket
      await connectWebSocket();

      // Process each valid table
      for (const table of VALID_TABLES) {
        let hasMore = true;

        const progress = syncProgressRef.current[table];

        while (hasMore) {
          const {data} = await fetchBatch(table, progress);
          if (data.length === 0) {
            hasMore = false;
            break;
          }

          await sendData(table, progress, data);
          await delay(100);
        }
        await markRecordsAsSynced(progress, table);
        await reset(progress);
      }
      sync.setSdStatus(SyncStatus_Enum.Done);
      sync.setSdTimestamp(new Date());
    } catch (error) {
      log(`Sync failed: ${error}`, 'error');
      sync.setPdStatus(SyncStatus_Enum.Error);
      setError(typeof error === 'string' ? error : 'Unknown error occurred');
    } finally {
      setIsSyncingSensor(false);
      // Reset progress after short delay
      setTimeout(() => 2000);
    }
  }, [isSyncingSensor, connectWebSocket, fetchBatch, sendData, db, log]);

  // Helper function for delays
  const delay = useCallback((ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const reset = useCallback(async (progress: ProgressEntry) => {
    (progress.offset = 0), (progress.complete = false);
    (progress.offset = 0), (progress.ids = []);
  }, []);

  return {
    startSync,
    isSyncingSensor,
    error,
    resetError: () => setError(null),
  };
};

export default useDataSync;
