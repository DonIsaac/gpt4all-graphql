import { Module } from '@nestjs/common'
import { databaseProviders } from './database.provider'
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './database.config'

@Module({
    imports: [ConfigModule.forFeature(databaseConfig)],
    providers: [...databaseProviders],
    exports: [...databaseProviders],
})
export class DatabaseModule {}
