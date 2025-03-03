import {DatabaseService, OP_DB_TABLE} from './databaseService';

export interface BioData {
  bioImpedance: number;
  phaseAngle: number;
  time: number;
}

export interface EcgData {
  ecg: number;
  time: number;
}

// Bio sensor specific interface
export interface BioSensorData {
  visit_id: string;
  interval_tag: number;
  time: number;
  config: string;
  frequency: number;
  bioImpedance: number;
  phaseAngle: number;
}

// ECG sensor specific interface
export interface EcgSensorData {
  visit_id: string;
  interval_tag: number;
  time: number;
  sensorType?: string;
  ecg: number;
  is_synced?: number;
}

export class SensorRepository {
  private db: DatabaseService;
  private insertQueue: {
    type: 'bio' | 'ecg';
    data: BioSensorData[] | EcgSensorData[];
    resolve: (value: boolean) => void;
    reject: (reason: any) => void;
  }[] = [];
  private isProcessing = false;
  private batchSize = 100; // Adjust based on your performance needs

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Insert multiple BIO_SENSOR records using transaction
   * @param dataArray Array of BioSensorData objects
   * @returns Promise resolving to boolean indicating success or failure
   */
  async bulkInsertBioSensorData(dataArray: BioSensorData[]): Promise<boolean> {
    if (!this.db || dataArray.length === 0) {
      return false;
    }

    return new Promise((resolve, reject) => {
      this.insertQueue.push({
        type: 'bio',
        data: dataArray,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Insert multiple ECG_SENSOR records using transaction
   * @param dataArray Array of EcgSensorData objects
   * @returns Promise resolving to boolean indicating success or failure
   */
  async bulkInsertEcgSensorData(dataArray: EcgSensorData[]): Promise<boolean> {
    if (!this.db || dataArray.length === 0) {
      return false;
    }

    return new Promise((resolve, reject) => {
      this.insertQueue.push({
        type: 'ecg',
        data: dataArray,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue of insert operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.insertQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const item = this.insertQueue.shift();
      if (!item) {
        this.isProcessing = false;
        return;
      }

      let success = false;
      if (item.type === 'bio') {
        success = await this.executeBioInsert(item.data as BioSensorData[]);
      } else {
        success = await this.executeEcgInsert(item.data as EcgSensorData[]);
      }

      item.resolve(success);
    } catch (error) {
      const item = this.insertQueue[0];
      if (item) {
        item.reject(error);
      }
    } finally {
      this.isProcessing = false;

      // Continue processing queue
      if (this.insertQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  /**
   * Execute Bio sensor data insertion using transactions and batch processing
   */
  private async executeBioInsert(dataArray: BioSensorData[]): Promise<boolean> {
    try {
      // Create batch commands for better performance
      const query = `
        INSERT INTO ${OP_DB_TABLE.bioSensor} (
          time, 
          visit_id,
          interval_tag,
          config,
          frequency,
          bioImpedace,
          phaseAngle
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const commands: [string, any[]][] = dataArray.map(data => [
        query,
        [
          data.time,
          data.visit_id,
          data.interval_tag,
          data.config,
          data.frequency,
          data.bioImpedance,
          data.phaseAngle,
        ],
      ]);

      // Process in batches if there are a lot of records
      if (commands.length > this.batchSize) {
        const batches = this.chunkArray(commands, this.batchSize);

        for (const batch of batches) {
          await this.db.executeBatch(batch);
        }
      } else {
        await this.db.executeBatch(commands);
      }

      return true;
    } catch (error) {
      console.error('Error inserting bio sensor data:', error);
      return false;
    }
  }

  /**
   * Execute ECG sensor data insertion using transactions and batch processing
   */
  private async executeEcgInsert(dataArray: EcgSensorData[]): Promise<boolean> {
    try {
      // Create batch commands for better performance
      const query = `
        INSERT INTO ${OP_DB_TABLE.ecgSensor} (
          time, 
          visit_id,
          interval_tag,
          sensorType,
          ecg,
          is_synced
        ) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const commands: [string, any[]][] = dataArray.map(data => [
        query,
        [
          data.time,
          data.visit_id,
          data.interval_tag,
          data.sensorType || 'ecgSensor',
          data.ecg,
          data.is_synced || 0,
        ],
      ]);

      // Process in batches if there are a lot of records
      if (commands.length > this.batchSize) {
        const batches = this.chunkArray(commands, this.batchSize);

        for (const batch of batches) {
          await this.db.executeBatch(batch);
        }
      } else {
        await this.db.executeBatch(commands);
      }

      return true;
    } catch (error) {
      console.error('Error inserting ECG sensor data:', error);
      return false;
    }
  }

  /**
   * Helper method to split an array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
