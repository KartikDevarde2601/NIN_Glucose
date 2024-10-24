import {open,DB} from '@op-engineering/op-sqlite'
import { TABLE } from './db_table';

export class DatabaseService {
    private readonly db_config= {
        name: 'sensorDB',
    }

    private database: DB | null = null;
    private static instance: DatabaseService | null = null;

    private constructor() {
    }

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
                    `CREATE TABLE IF NOT EXISTS ${TABLE.biosensor_data} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visit_id TEXT,
                        sensor_type TEXT DEFAULT 'BIOSENSOR',
                        data TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS ${TABLE.temperature_data} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visit_id TEXT,
                        sensor_type TEXT DEFAULT 'TEMPERATURE',
                        data TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
    
                    CREATE TABLE IF NOT EXISTS ${TABLE.glucose_data} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visit_id TEXT,
                        sensor_type TEXT DEFAULT 'GLUCOSE',
                        data TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
    
                    CREATE TABLE IF NOT EXISTS ${TABLE.gsr_data} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visit_id TEXT,
                        sensor_type TEXT DEFAULT 'GSR',
                        data TEXT,
                        is_synced INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );`
                );
            }
        } catch (error) {
            console.error('Error initializing database', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        try {
            if(this.database){
                await this.database.close();
                this.database = null;
            }
        } catch (error) {
            console.error('Error closing database', error);
            throw error;
        }
     
    }

   async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    if(!this.database){
        throw new Error('Database not initialized');
    }

    const results = await this.database.execute(query, params);
    return results as unknown as T[];
}

   async transaction<T>(query: string): Promise<T> {
    if (!this.database) {
        throw new Error('Database not initialized');
    }

    return await this.database.transaction(async (tx) => {
        try {
            await tx.execute(query);
            await tx.commit();
        } catch (error) {
            console.error('Error executing transaction', error);
            await tx.rollback();
            throw error;
        }
    }) as unknown as T;
}
}