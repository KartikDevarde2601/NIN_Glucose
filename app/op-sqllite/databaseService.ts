import {open, DB} from '@op-engineering/op-sqlite';

const BIO_SENSOR = 'BIO_SENSOR';
const ECG_SENSOR = 'ECG_SENSOR';

export const OP_DB_TABLE = {
  bioSensor: BIO_SENSOR,
  ecgSensor: ECG_SENSOR,
};

export class DatabaseService {
  private readonly db_config = {
    name: 'sensorDB',
  };

  private database: DB | null = null;
  private static instance: DatabaseService | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initDatabase() {
    try {
      this.database = await open(this.db_config);
      if (this.database) {
        await this.database.execute(
          `CREATE TABLE IF NOT EXISTS ${OP_DB_TABLE.bioSensor} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER DEFAULT 0,
            visit_id TEXT,
            interval_tag INTEGER,
            config TEXT,
            frequency INTEGER,
            sensorType TEXT DEFAULT 'bioSensor',
            bioImpedance INTEGER,
            phaseAngle INTEGER,
            is_synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS ${OP_DB_TABLE.ecgSensor} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER DEFAULT 0,
            visit_id TEXT,
            interval_tag INTEGER,
            sensorType TEXT DEFAULT 'ecgSensor',
            ecg INTEGER,
            is_synced INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`,
        );
      }
    } catch (error) {
      console.error('Error initializing database', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.database) {
        await this.database.close();
        this.database = null;
      }
    } catch (error) {
      console.error('Error closing database', error);
      throw error;
    }
  }

  async execute<T>(query: string, params: any[] = []): Promise<{rows: T[]}> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return (await this.database.execute(query, params)) as {rows: T[]};
  }

  /**
   * Execute a batch of SQL statements in a transaction
   * @param commands Array of [query, params] tuples
   */
  async executeBatch(
    commands: [string, any[]][],
  ): Promise<{rowsAffected: number}> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const result = await this.database.executeBatch(commands);
    return {rowsAffected: result.rowsAffected ?? 0};
  }
}
