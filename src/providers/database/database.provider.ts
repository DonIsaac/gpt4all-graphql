import { ConfigService } from '@nestjs/config'
import { DataSource, DataSourceOptions } from 'typeorm'
import { DatabaseConfig } from './database.config'
import { Logger, Provider } from '@nestjs/common'

type MappedDatabaseConfig = {
    [P in keyof DatabaseConfig as `database.${P}`]: DatabaseConfig[P]
}

const DATABASE_TOKEN = Symbol.for('DATABASE_TOKEN')
const logger = new Logger('DatabaseProvider')
export const databaseProviders = [
    {
        provide: DATABASE_TOKEN,
        useFactory: async (config: ConfigService<MappedDatabaseConfig>) => {
            const dataSource = new DataSource({
                type: config.getOrThrow('database.type'),
                host: config.getOrThrow('database.host'),
                port: parseInt(config.getOrThrow('database.port'), 10),
                username: config.get('database.username'),
                password: config.get('database.password') as string,
                database: config.get('database.database', 'nomic'),
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: process.env.NODE_ENV === 'development',
            } as DataSourceOptions)
            await dataSource.initialize()
            logger.log('Database connection established', {
                ...dataSource.options,
            })
            return dataSource
            // dataSource.logger.
        },
        inject: [ConfigService],
    },
] satisfies Provider[]
