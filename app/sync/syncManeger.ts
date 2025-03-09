import {DatabaseService} from '../op-sqllite/databaseService';
import {OP_DB_TABLE} from '../op-sqllite/databaseService';

interface SyncOptions {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  syncTimeout?: number;
  maxRetries?: number;
  debugMode?: boolean;
}

interface ProgressEntry {
  offset: number;
  complete: boolean;
  retries: number;
  lastError: Date | null;
  batchId: number;
}

interface SyncProgress {
  [key: string]: ProgressEntry;
}

interface PendingAckEntry {
  resolve: () => void;
  reject: NodeJS.Timeout;
}

interface ServerResponse {
  success: boolean;
  error?: string;
  table?: string;
  batchId?: number;
}

interface BatchData {
  batchId: number;
  data: any[];
}

// Valid tables for SQL injection protection
const VALID_TABLES = new Set([OP_DB_TABLE.bioSensor, OP_DB_TABLE.ecgSensor]);

class SyncManager {
  private serverUrl: string;
  private branchSize: number;
  private ws: WebSocket | null;
  private db: DatabaseService;
  private pendingAck: Map<number, PendingAckEntry>;
  private config: Required<SyncOptions>;
  private syncInProgress: boolean;
  private reconnectCount: number;
  private syncProgress: SyncProgress;

  constructor(
    serverUrl: string,
    branchSize: number,
    options: SyncOptions = {},
  ) {
    this.serverUrl = serverUrl;
    this.branchSize = branchSize;
    this.ws = null;
    this.db = DatabaseService.getInstance();
    this.pendingAck = new Map();

    this.config = {
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 5000,
      syncTimeout: options.syncTimeout || 30000,
      maxRetries: options.maxRetries || 3,
      debugMode: options.debugMode || false,
    };

    this.syncInProgress = false;
    this.reconnectCount = 0;

    this.syncProgress = this.initializeSyncProgress();
  }

  private initializeSyncProgress(): SyncProgress {
    return {
      biosensor_data: this.createProgressEntry(),
      temperature_data: this.createProgressEntry(),
      glucose_data: this.createProgressEntry(),
      gsr_data: this.createProgressEntry(),
    };
  }

  private createProgressEntry(): ProgressEntry {
    return {
      offset: 0,
      complete: false,
      retries: 0,
      lastError: null,
      batchId: 0,
    };
  }

  private _log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info',
  ): void {
    if (this.config.debugMode) {
      const timestamp = new Date().toISOString();
      console[level](`[SyncManager ${timestamp}] ${message}`);
    }
  }

  // ...existing code...

  async connectWebSocket(): Promise<WebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) return this.ws;

    try {
      this.ws = new WebSocket(this.serverUrl);
      await this.setupWebSocketHandlers();
      return this.ws;
    } catch (error) {
      this._log(`WebSocket connection failed: ${error}`, 'error');
      this.reconnect();
      throw error;
    }
  }

  private setupWebSocketHandlers(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout: NodeJS.Timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, this.config.syncTimeout);

      if (!this.ws) throw new Error('WebSocket not initialized');

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this._log('WebSocket connected');
        this.reconnectCount = 0;
        resolve();
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        try {
          const response: ServerResponse = JSON.parse(event.data);
          await this.handleServerResponse(response);
        } catch (error) {
          this._log(`Message handling error: ${error}`, 'error');
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        this._log(`WebSocket closed: ${event.reason}`, 'warn');
        this.handleConnectionLoss();
      };

      this.ws.onerror = (error: Event) => {
        reject(error);
      };
    });
  }

  private handleConnectionLoss(): void {
    this.ws = null;
    if (this.syncInProgress) {
      this._log('Connection lost during sync, attempting reconnect...', 'warn');
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      this._log('Max reconnect attempts reached', 'error');
      return;
    }

    const delay = this.config.reconnectDelay * 2 ** this.reconnectCount;
    this.reconnectCount++;

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        if (this.syncInProgress) await this.resumeSync();
      } catch (error) {
        this._log(`Reconnect failed: ${error}`, 'error');
      }
    }, delay);
  }

  async startSync(): Promise<boolean> {
    if (this.syncInProgress) {
      this._log('Sync already in progress', 'warn');
      return false;
    }

    try {
      this.syncInProgress = true;
      await this.ensureWebSocketConnection();

      for (const table of VALID_TABLES) {
        await this.syncTable(table);
      }

      this._log('Full sync completed successfully');
      return true;
    } catch (error) {
      this._log(`Sync failed: ${error}`, 'error');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async resumeSync(): Promise<void> {
    this._log('Resuming interrupted sync...');
    for (const [table, progress] of Object.entries(this.syncProgress)) {
      if (!progress.complete) {
        await this.syncTable(table);
      }
    }
  }

  private async ensureWebSocketConnection(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }
  }

  private async syncTable(tableName: string): Promise<void> {
    if (!VALID_TABLES.has(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    const progress = this.syncProgress[tableName];

    while (!progress.complete) {
      try {
        const {batchId, data} = await this.fetchBatch(tableName, progress);
        if (data.length === 0) {
          progress.complete = true;
          break;
        }

        await this.sendBatch(tableName, batchId, data, progress.offset);
        await this.waitForAck(tableName, batchId);

        progress.offset += this.branchSize;
        progress.retries = 0;
      } catch (error) {
        if (progress.retries >= this.config.maxRetries) {
          this._log(
            `Max retries reached for ${tableName}, stopping sync`,
            'error',
          );
          throw error;
        }

        progress.retries++;
        progress.lastError = new Date();
        this._log(
          `Retrying ${tableName} (attempt ${progress.retries})...`,
          'warn',
        );
        await this.delay(1000 * progress.retries);
      }
    }
  }

  private async fetchBatch(
    tableName: string,
    progress: ProgressEntry,
  ): Promise<BatchData> {
    const batchId = progress.batchId++;
    this._log(`Fetching batch ${batchId} for ${tableName}`);

    const query = `
      SELECT * FROM ${tableName}
      WHERE is_synced = 0
      ORDER BY id
      LIMIT ? OFFSET ?
    `;

    const result = await this.db.execute(query, [
      this.branchSize,
      progress.offset,
    ]);
    return {batchId, data: result.rows};
  }

  private async sendBatch(
    tableName: string,
    batchId: number,
    data: any[],
    offset: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const message = {
        type: 'sync_data',
        table: tableName,
        batchId,
        data,
        offset,
        timestamp: Date.now(),
      };

      const timeout = setTimeout(() => {
        this.pendingAck.delete(batchId);
        reject(new Error(`Ack timeout for batch ${batchId}`));
      }, this.config.syncTimeout);

      this.pendingAck.set(batchId, {resolve, reject: timeout});

      try {
        if (!this.ws) throw new Error('WebSocket not connected');
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async waitForAck(tableName: string, batchId: number): Promise<void> {
    const pending = this.pendingAck.get(batchId);
    if (!pending) throw new Error(`No pending ack for batch ${batchId}`);

    const {resolve, reject} = pending;
    try {
      await this.markBatchSynced(tableName, batchId);
      resolve();
    } catch (error) {
      clearTimeout(reject);
      throw error;
    } finally {
      this.pendingAck.delete(batchId);
    }
  }

  private async markBatchSynced(
    tableName: string,
    batchId: number,
  ): Promise<void> {
    const query = `
      UPDATE ${tableName}
      SET is_synced = 1
      WHERE id IN (
        SELECT id FROM ${tableName}
        WHERE is_synced = 0
        ORDER BY id
        LIMIT ? OFFSET ?
      )
    `;

    const offset = this.syncProgress[tableName].offset;
    await this.db.execute(query, [this.branchSize, offset]);
    this._log(`Marked batch ${batchId} as synced for ${tableName}`);
  }

  private async handleServerResponse(response: ServerResponse): Promise<void> {
    if (!response.success) {
      throw new Error(`Server error: ${response.error}`);
    }

    const {table, batchId} = response;
    if (batchId && this.pendingAck.has(batchId)) {
      const pending = this.pendingAck.get(batchId);
      if (pending) pending.resolve();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanupSyncedData(): Promise<void> {
    try {
      for (const table of VALID_TABLES) {
        await this.db.transactional(`DELETE FROM ${table} WHERE is_synced = 1`);
      }
      this._log('Successfully cleaned up synced data');
    } catch (error) {
      this._log(`Cleanup failed: ${error}`, 'error');
    }
  }
}

export default SyncManager;
