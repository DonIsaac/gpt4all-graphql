import { DATABASE_TOKEN } from '@/database'
import { Provider } from '@nestjs/common'
import { Conversation } from './conversation.entity'
import { DataSource } from 'typeorm'
import { Message } from './message.entity'

export const CONVERSATION_REPOSITORY = Symbol.for('CONVERSATION_REPOSITORY')
export const MESSAGE_REPOSITORY = Symbol.for('MESSAGE_REPOSITORY')
export const conversationProviders = [
    {
        provide: CONVERSATION_REPOSITORY,
        useFactory: (dataSource: DataSource) =>
            dataSource.getRepository(Conversation),
        inject: [DATABASE_TOKEN],
    },
    {
        provide: MESSAGE_REPOSITORY,
        useFactory: (dataSource: DataSource) =>
            dataSource.getRepository(Message),
        inject: [DATABASE_TOKEN],
    },
] satisfies Provider[]
