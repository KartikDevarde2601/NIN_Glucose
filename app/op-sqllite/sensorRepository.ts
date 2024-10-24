import { DB } from "@op-engineering/op-sqlite";
import { DatabaseService } from "./databaseService";
export interface bio_sensor {
    id?: number;
    visit_id: string;
    sensor_type?: string;
    data: string;
    is_synced?: number;
}


export class bio_sensorRepository {
    private db: DatabaseService;

    constructor() {
        this.db = DatabaseService.getInstance();
    }

    async insertBioData(data: bio_sensor): Promise<number> {
        const query = 'INSERT INTO biosensor_data (visit_id, data) VALUES (?,?)';
        if (this.db) {
            const result = await this.db.executeQuery<{insertId: number}>(query, [data.visit_id, data.data]);
            return result[0].insertId;
        } else {
            return -1;
        }
    }
}