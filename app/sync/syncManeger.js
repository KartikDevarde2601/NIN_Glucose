import {DatabaseService} from '../op-sqllite/databaseService';

class SyncManager {
  constructor(serverUrl, branchSize, options = {}) {
    this.serverUrl = serverUrl;
    this.branchSize = branchSize;
    this.ws = null;
    this.db = DatabaseService.getInstance();

    // Enhanced configuration with default options
    this.config = {
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 5000,
      syncTimeout: options.syncTimeout || 30000,
      debugMode: options.debugMode || false,
    };

    this.syncInProgress = false;
    this.reconnectCount = 0;

    // Enhanced sync progress tracking with error handling
    this.syncProgress = {
      biosensor_data: {
        offset: 0,
        complete: false,
        errors: 0,
        lastErrorTime: null,
      },
      temperature_data: {
        offset: 0,
        complete: false,
        errors: 0,
        lastErrorTime: null,
      },
      glucose_data: {
        offset: 0,
        complete: false,
        errors: 0,
        lastErrorTime: null,
      },
      gsr_data: {offset: 0, complete: false, errors: 0, lastErrorTime: null},
    };
  }

  // Improved logging method
  _log(message, level = 'info') {
    if (this.config.debugMode) {
      const timestamp = new Date().toISOString();
      console[level](`[SyncManager ${timestamp}] ${message}`);
    }
  }

  // Enhanced WebSocket connection method
  connectWebSocket() {
    // Prevent multiple connection attempts
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._log('WebSocket already connected');
      return this.ws;
    }

    try {
      this.ws = new WebSocket(this.serverUrl);

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws.readyState === WebSocket.CONNECTING) {
          this._log('WebSocket connection timeout', 'error');
          this.ws.close();
          this.reconnect();
        }
      }, this.config.syncTimeout);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this._log('WebSocket connected');
        this.reconnectCount = 0; // Reset reconnect counter on successful connection
      };

      this.ws.onmessage = async event => {
        try {
          const response = JSON.parse(event.data);
          this._log(`Received message: ${JSON.stringify(response)}`);
          await this.handleServerResponse(response);
        } catch (parseError) {
          this._log(`Error parsing WebSocket message: ${parseError}`, 'error');
        }
      };

      this.ws.onclose = event => {
        this._log(
          `WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`,
          'warn',
        );
        this.ws = null;
        this.reconnect();
      };

      this.ws.onerror = error => {
        this._log(`WebSocket error: ${error}`, 'error');
        this.reconnect();
      };

      return this.ws;
    } catch (connectionError) {
      this._log(`WebSocket connection error: ${connectionError}`, 'error');
      this.reconnect();
    }
  }

  // Improved reconnect method with exponential backoff
  reconnect() {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      this._log(
        'Max reconnection attempts reached. Stopping reconnection.',
        'error',
      );
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;

    this._log(
      `Attempting to reconnect (Attempt ${this.reconnectCount})...`,
      'warn',
    );

    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  // Enhanced sync method with comprehensive error handling
  async startSync() {
    if (this.syncInProgress) {
      this._log('Sync already in progress', 'warn');
      return false;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this._log('WebSocket not connected. Attempting to connect...', 'warn');
      this.connectWebSocket();
    }

    this.syncInProgress = true;

    try {
      for (const table of Object.keys(this.syncProgress)) {
        try {
          await this.syncTable(table);
        } catch (tableError) {
          // Handle individual table sync errors
          this.syncProgress[table].errors++;
          this.syncProgress[table].lastErrorTime = new Date();
          this._log(`Error syncing table ${table}: ${tableError}`, 'error');
        }
      }

      this._log('Sync completed successfully');
      return true;
    } catch (syncError) {
      this._log(`Overall sync error: ${syncError}`, 'error');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Rest of the methods remain largely the same with added error logging
  async syncTable(tableName) {
    const progress = this.syncProgress[tableName];

    while (!progress.complete) {
      try {
        const data = await this.fetchBatch(tableName, progress.offset);

        if (data.length === 0) {
          progress.complete = true;
          console.log('Sync completed for table: ', tableName);
          break;
        }

        this.ws.send(
          JSON.stringify({
            type: 'sync_data',
            table: tableName,
            data: data,
            offset: progress.offset,
          }),
        );

        progress.offset += this.branchSize;
      } catch (error) {
        this._log(`Error during table sync: ${error}`, 'error');
        throw error;
      }
    }
  }

  async fetchBatch(tableName, offset) {
    const query = `SELECT * FROM ${tableName} LIMIT ${this.branchSize} OFFSET ${offset}`;

    const data = await this.db.executeQuery(query);
    return data.rows;
  }

  async UpdateIsSyncedData(tableName, offset) {
    const query = `
      UPDATE ${tableName}
      SET is_synced = 1
      WHERE id IN (
        SELECT id
        FROM ${tableName}
        ORDER BY id
        LIMIT 100
        OFFSET ${offset}
      )
    `;
    await this.db.executeQuery(query);
  }

  async deleteIsSyncedData() {
    for (const table of Object.keys(this.syncProgress)) {
      // this.deleteIsSyncedDataInTable(table);
      console.log('Deleting is_synced data from table: ', table);
    }
  }

  deleteIsSyncedDataInTable(tableName) {
    const query = `DELETE FROM ${tableName} WHERE is_synced = 1`;
    return this.db.executeQuery(query);
  }

  async handleSeverResponse(respose) {
    const {table, offset} = respose;
    await this.UpdateIsSyncedData(table, offset);
  }
}

export default SyncManager;
