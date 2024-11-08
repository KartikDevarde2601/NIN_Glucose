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
    console.log(this.serverUrl);
    this.ws = new WebSocket(this.serverUrl);
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.startSync();
    };

    this.ws.onmessage = event => {
      const response = JSON.parse(event.data);

      // response object will be like this
      /* {
        type: 'sync_confirmation',
        table: 'tableName',
        offset: offset,
        successIds: [array of processed IDs ]
      } */

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

    this.syncInProgress = false;
  }

  async syncTable(tableName) {
    const progress = this.syncProgress[tableName];

    while (!progress.complete) {
      const data = await this.fetchBatch(tableName, progress.offset);

      console.log('syncTable: ', data);

      if (data.length === 0) {
        progress.complete = true;
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
    console.log('Fetched data: ', data);
    return data.rows;
  }

  async deleteConfirmedData(tableName, ids) {
    const query = `DELETE FROM ${tableName} WHERE id IN (${ids.join(',')})`;
    await this.db.transaction(query);
  }

  async handleSeverResponse(respose) {
    const {table, offset, ids} = respose;

    if (ids.length > 0) {
      await this.deleteConfirmedData(table, ids);
    }
  }
}

export default SyncManager;
