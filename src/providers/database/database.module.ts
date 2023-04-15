import { Module } from '@nestjs/common'
import { databaseProviders } from './database.provider'
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './database.config'

/**
 * Provides access to a database connection.
 *
 * ## Configuration
 * Database connection options are configured via `DATABASE_*` environment
 * variables. Relevant variables are:
 * - `DATABASE_TYPE` - The type of database to connect to. Currently only
 *  `sqlite` is supported.
 * - `DATABASE_HOST` - The host of the database server.
 * - `DATABASE_PORT` - The port of the database server.
 * - `DATABASE_USERNAME` - The username to use when connecting to the database.
 * - `DATABASE_PASSWORD` - The password to use when connecting to the database.
 * - `DATABASE_DATABASE` - The name of the database to connect to. For SQLite,
 *   this is a path to the database file. Currently defaults to `dev.db`.
 */
@Module({
    imports: [ConfigModule.forFeature(databaseConfig)],
    providers: [...databaseProviders],
    exports: [...databaseProviders],
})
export class DatabaseModule {}
