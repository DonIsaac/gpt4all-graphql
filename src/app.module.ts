import path from 'path'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            debug: process.env.NODE_ENV !== 'production',
            playground: true,
            autoSchemaFile: path.join(process.cwd(), 'codegen/schema.gql'),
            sortSchema: true,
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
