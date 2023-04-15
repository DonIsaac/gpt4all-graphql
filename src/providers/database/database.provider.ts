import { ConfigService } from '@nestjs/config'
import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { DatabaseConfig } from './database.config'
import { Logger, Provider } from '@nestjs/common'
import { NestedConfig } from '../../types'

type MappedDatabaseConfig = NestedConfig<'database', DatabaseConfig>

/**
 * The injection token used to provide access to the database connection.
 *
 * @example
 * ```ts
 * import { DATABASE_TOKEN } from 'providers/database'
 * import { MyEntity } from './my-entity.entity'
 *
 * export const myEntityProviders = [
 *   {
 *     provide: 'MY_ENTITY_REPOSITORY',
 *     useFactory: (connection: Connection) => connection.getRepository(MyEntity),
 *     inject: [DATABASE_TOKEN],
 *   }
 * ]
 * ```
 */
export const DATABASE_TOKEN = Symbol.for('DATABASE_TOKEN')
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
                entities: [
                    path.join(
                        __dirname,
                        '..',
                        '..',
                        'modules',
                        '**/*.entity{.ts,.js}'
                    ),
                ],
                synchronize: process.env.NODE_ENV === 'development',
                logging: true,
            } as DataSourceOptions)

            try {
                await dataSource.initialize()
                logger.log('Database connection established', {
                    ...dataSource.options,
                })
                return dataSource
            } catch (e) {
                const err = e as Error
                err.message = `Failed to connect to database: ${err.message}`
                console.error(e)
                throw e
            }
        },
        inject: [ConfigService],
    },
] satisfies Provider[]
