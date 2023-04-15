import { registerAs } from '@nestjs/config'
import { DataSourceOptions } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'

export type DatabaseConfig = {
    type: string
    host: string
    port: number
    username: string
    password: string
    database?: string
}
const databaseConfig = registerAs<Partial<DatabaseConfig>>('database', () => {
    const {
        DATABASE_TYPE: type,
        DATABASE_HOST: host,
        DATABASE_PORT: port,
        DATABASE_USERNAME: username,
        DATABASE_PASSWORD: password,
        DATABASE_NAME: database = 'dev.db',
    } = process.env

    return {
        type,
        host,
        port: port ? parseInt(port, 10) : undefined,
        username,
        password,
        database,
    }
})

export default databaseConfig
