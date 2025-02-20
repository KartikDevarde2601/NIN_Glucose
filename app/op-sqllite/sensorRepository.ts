import {DB} from '@op-engineering/op-sqlite';
import {DatabaseService} from './databaseService';
export interface sensor_data {
  id?: number;
  visit_id: string;
  interval_tag: number;
  interval: number;
  config: string;
  frequency: number;
  time: number;
  sensor_type?: string;
  data: string;
  is_synced?: number;
}

export class sensorRepository {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async insertSensordata<T>(
    data: sensor_data,
    tablename: string,
  ): Promise<T[]> {
    const query = `INSERT INTO ${tablename} (time, visit_id, config, frequency, data) VALUES (?, ?, ?, ?, ?)`;
    if (this.db) {
      const result = await this.db.executeQuery(query, [
        data.time,
        data.visit_id,
        data.config,
        data.frequency,
        data.data,
      ]);
      return result as T[];
    } else {
      return [];
    }
  }
}
