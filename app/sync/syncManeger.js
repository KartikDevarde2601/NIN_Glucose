import {DatabaseService} from '../op-sqllite/databaseService';

class SyncManager {
  constructor(serverUrl, branchSize, db) {
    this.serverUrl = serverUrl;
    this.branchSize = branchSize;
    this.ws = null;
    this.db = DatabaseService.getInstance();
    this.syncInProgress = false;

    this.syncProgress = {
      biosensor_data: {offset: 0, complete: false},
      temperature_data: {offset: 0, complete: false},
      glucose_data: {offset: 0, complete: false},
      gsr_data: {offset: 0, complete: false},
    };
  }

  connectWebSocket() {
    if (this.ws) {
      return this.ws;
    }
    this.ws = new WebSocket(this.serverUrl);
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      return this.ws;
    };

    this.ws.onmessage = event => {
      const response = JSON.parse(event.data);

      // response object will be like this
      /* {
        type: 'sync_confirmation',
        table: 'tableName',
        offset: offset,
      } */
      console.log('response: ', response);
      this.handleSeverResponse(response);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.ws = null;
    };

    this.ws.onerror = error => {
      console.log('WebSocket error: ', error);
      this.reconnect();
    };
  }

  reconnect() {
    setTimeout(() => {
      this.connectWebSocket();
    }, 5000);
  }

  async startSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    for (const table of Object.keys(this.syncProgress)) {
      console.log('Syncing table: ', table);
      await this.syncTable(table);
    }

    console.log('Sync completed');

    this.syncInProgress = false;
    return true;
  }

  async syncTable(tableName) {
    const progress = this.syncProgress[tableName];

    while (!progress.complete) {
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
